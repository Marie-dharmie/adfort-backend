import type { GeneratedContentStatus, GeneratedContentType, Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { prisma } from '../config/database';
import { chatWithAssistant, generateContent, type BusinessAiContext, type ConversationMessage } from '../services/ai.service';

const getRouteId = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const getBusinessContextForUser = async (businessId: string, userId: string): Promise<BusinessAiContext | null> => {
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId },
    include: {
      visibilityScores: {
        orderBy: { calculatedAt: 'desc' },
        take: 1
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!business) {
    return null;
  }

  return {
    business,
    latestVisibilityScore: business.visibilityScores[0] ?? null,
    reviews: business.reviews
  };
};

const normalizeConversationMessages = (messages: unknown): ConversationMessage[] => {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message): message is ConversationMessage => {
      if (!message || typeof message !== 'object') {
        return false;
      }

      const candidate = message as Record<string, unknown>;
      return (
        (candidate.role === 'system' || candidate.role === 'user' || candidate.role === 'assistant') &&
        typeof candidate.content === 'string'
      );
    })
    .map((message) => ({
      role: message.role as ConversationMessage['role'],
      content: message.content
    }));
};

export const postAiChat = async (req: Request, res: Response) => {
  const { businessId, message, conversationId } = req.body as {
    businessId: string;
    message: string;
    conversationId?: string;
  };

  const context = await getBusinessContextForUser(businessId, req.user!.id);

  if (!context) {
    return res.status(404).json({ message: 'Business not found' });
  }

  const existingConversation = conversationId
    ? await prisma.aiConversation.findFirst({
        where: { id: conversationId, userId: req.user!.id, businessId }
      })
    : null;

  const history = normalizeConversationMessages(existingConversation?.messages);
  const assistantReply = await chatWithAssistant(context, message, history);
  const updatedMessages: ConversationMessage[] = [
    ...history,
    { role: 'user', content: message },
    { role: 'assistant', content: assistantReply }
  ];

  const conversation = existingConversation
    ? await prisma.aiConversation.update({
        where: { id: existingConversation.id },
        data: { messages: updatedMessages }
      })
    : await prisma.aiConversation.create({
        data: {
          userId: req.user!.id,
          businessId,
          messages: updatedMessages
        }
      });

  return res.status(existingConversation ? 200 : 201).json({
    conversationId: conversation.id,
    response: assistantReply,
    messages: updatedMessages
  });
};

export const listAiConversations = async (req: Request, res: Response) => {
  const businessId = typeof req.query.businessId === 'string' ? req.query.businessId : undefined;

  const conversations = await prisma.aiConversation.findMany({
    where: {
      userId: req.user!.id,
      ...(businessId ? { businessId } : {})
    },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          category: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return res.json(conversations);
};

export const getAiConversation = async (req: Request, res: Response) => {
  const conversationId = getRouteId(req.params.id);

  if (!conversationId) {
    return res.status(400).json({ message: 'Conversation id is required' });
  }

  const conversation = await prisma.aiConversation.findFirst({
    where: {
      id: conversationId,
      userId: req.user!.id
    },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          category: true
        }
      }
    }
  });

  if (!conversation) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  return res.json(conversation);
};

export const deleteAiConversation = async (req: Request, res: Response) => {
  const conversationId = getRouteId(req.params.id);

  if (!conversationId) {
    return res.status(400).json({ message: 'Conversation id is required' });
  }

  const result = await prisma.aiConversation.deleteMany({
    where: {
      id: conversationId,
      userId: req.user!.id
    }
  });

  if (result.count === 0) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  return res.json({ message: 'Conversation deleted' });
};

export const postGenerateContent = async (req: Request, res: Response) => {
  const { businessId, contentType, additionalInstructions, save = false, status } = req.body as {
    businessId: string;
    contentType: GeneratedContentType;
    additionalInstructions?: string;
    save?: boolean;
    status?: GeneratedContentStatus;
  };

  const context = await getBusinessContextForUser(businessId, req.user!.id);

  if (!context) {
    return res.status(404).json({ message: 'Business not found' });
  }

  const generated = await generateContent(context, contentType, additionalInstructions);

  if (!save) {
    return res.json(generated);
  }

  const savedContent = await prisma.generatedContent.create({
    data: {
      businessId,
      userId: req.user!.id,
      type: contentType,
      title: generated.title,
      content: generated.content,
      status: status ?? 'SAVED'
    }
  });

  return res.status(201).json(savedContent);
};

export const listGeneratedContent = async (req: Request, res: Response) => {
  const type = typeof req.query.type === 'string' ? (req.query.type as GeneratedContentType) : undefined;
  const status = typeof req.query.status === 'string' ? (req.query.status as GeneratedContentStatus) : undefined;
  const businessId = typeof req.query.businessId === 'string' ? req.query.businessId : undefined;

  const content = await prisma.generatedContent.findMany({
    where: {
      userId: req.user!.id,
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(businessId ? { businessId } : {})
    },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          category: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return res.json(content);
};

export const updateGeneratedContent = async (req: Request, res: Response) => {
  const contentId = getRouteId(req.params.id);
  const data: Prisma.GeneratedContentUpdateInput = {};

  if (!contentId) {
    return res.status(400).json({ message: 'Generated content id is required' });
  }

  if (typeof req.body.title === 'string') {
    data.title = req.body.title;
  }

  if (typeof req.body.content === 'string') {
    data.content = req.body.content;
  }

  if (typeof req.body.status === 'string') {
    data.status = req.body.status as GeneratedContentStatus;
  }

  const existing = await prisma.generatedContent.findFirst({
    where: {
      id: contentId,
      userId: req.user!.id
    }
  });

  if (!existing) {
    return res.status(404).json({ message: 'Generated content not found' });
  }

  const updated = await prisma.generatedContent.update({
    where: { id: existing.id },
    data
  });

  return res.json(updated);
};

export const deleteGeneratedContent = async (req: Request, res: Response) => {
  const contentId = getRouteId(req.params.id);

  if (!contentId) {
    return res.status(400).json({ message: 'Generated content id is required' });
  }

  const result = await prisma.generatedContent.deleteMany({
    where: {
      id: contentId,
      userId: req.user!.id
    }
  });

  if (result.count === 0) {
    return res.status(404).json({ message: 'Generated content not found' });
  }

  return res.json({ message: 'Generated content deleted' });
};

export const exportGeneratedContent = async (req: Request, res: Response) => {
  const contentId = getRouteId(req.params.id);

  if (!contentId) {
    return res.status(400).json({ message: 'Generated content id is required' });
  }

  const existing = await prisma.generatedContent.findFirst({
    where: {
      id: contentId,
      userId: req.user!.id
    }
  });

  if (!existing) {
    return res.status(404).json({ message: 'Generated content not found' });
  }

  const updated = await prisma.generatedContent.update({
    where: { id: existing.id },
    data: { status: 'EXPORTED' }
  });

  return res.json(updated);
};

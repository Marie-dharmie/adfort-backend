import * as QRCode from 'qrcode';

export const generateReviewQrCode = async (businessId: string, baseUrl?: string) => {
  const reviewUrl = `${baseUrl?.replace(/\/$/, '') ?? ''}/review/${businessId}`;
  const dataUrl = await QRCode.toDataURL(reviewUrl, {
    type: 'image/png',
    margin: 1,
    width: 320
  });

  return {
    url: reviewUrl,
    imageBase64: dataUrl
  };
};
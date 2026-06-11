export type Chat = {
  id: string;
  name: string;
  preview: string;
  time: string;
  badge?: string;
  read?: boolean;
  avatar: string;
  tone: string;
  tags: string[];
  remark: string;
  isWindowOpen: boolean;
};

export type ProductPreview = {
  title?: string;
  price?: string;
  image_url?: string;
  product_url?: string;
  caption?: string;
};

export type RichMessagePayload = {
  raw_text?: string;
  reply_context?: {
    title?: string;
    body?: string;
  };
  body?: string;
  header?: string;
  title?: string;
  caption?: string;
  image_url?: string;
  product_url?: string;
  button_text?: string;
  products?: ProductPreview[];
  buttons?: { title?: string }[];
};

declare module 'mammoth' {
  interface ConvertImageElement {
    contentType: string;
    buffer: Buffer;
  }

  interface MammothOptions {
    arrayBuffer: ArrayBuffer;
    transformDocument?: (element: any) => any;
    convertImage?: (element: ConvertImageElement) => Promise<{ src: string }>;
  }

  interface ConversionResult {
    value: string;
    messages: any[];
  }

  interface Mammoth {
    convertToHtml(options: MammothOptions): Promise<ConversionResult>;
    transforms: {
      paragraph: (transform: (element: any) => any) => any;
    };
  }

  const mammoth: Mammoth;
  export default mammoth;
} 
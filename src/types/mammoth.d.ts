declare module 'mammoth' {
  interface ConvertImageElement {
    contentType: string;
    buffer: Buffer;
  }

  interface DocumentElement {
    type: string;
    children?: DocumentElement[];
    preserveXml?: boolean;
    [key: string]: any;
  }

  interface MammothOptions {
    arrayBuffer: ArrayBuffer;
    transformDocument?: (document: DocumentElement) => DocumentElement;
    convertImage?: (element: ConvertImageElement) => Promise<{ src: string }>;
  }

  interface ConversionResult {
    value: string;
    messages: any[];
  }

  interface Mammoth {
    convertToHtml(options: MammothOptions): Promise<ConversionResult>;
    transforms: {
      paragraph: (transform: (element: DocumentElement) => DocumentElement) => (document: DocumentElement) => DocumentElement;
    };
  }

  const mammoth: Mammoth;
  export default mammoth;
} 
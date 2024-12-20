declare module 'mammoth-plus' {
  interface ConvertOptions {
    arrayBuffer: ArrayBuffer;
  }

  interface StyleMap {
    styleMap: string[];
  }

  interface ConversionResult {
    value: string;
    messages: any[];
  }

  function convertToHtml(options: ConvertOptions, styleOptions?: StyleMap): Promise<ConversionResult>;

  export default {
    convertToHtml
  };
} 
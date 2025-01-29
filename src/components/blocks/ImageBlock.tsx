import { IImageBlock } from '@/types/article';
import Image from 'next/image';

interface ImageBlockProps {
  block: IImageBlock;
  onUpdate: (updates: Partial<IImageBlock>) => void;
}

export const ImageBlock = ({ block, onUpdate }: ImageBlockProps) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // В реальном приложении здесь будет загрузка на сервер
      const fakeUrl = URL.createObjectURL(file);
      onUpdate({ src: fakeUrl, content: fakeUrl });
    }
  };

  // Используем src или content для отображения изображения
  const imageUrl = block.src || block.content || '';

  return (
    <div className="w-full space-y-2">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="w-full p-2"
      />
      {imageUrl && (
        <div className="relative w-full h-[300px]">
          <Image
            src={imageUrl}
            alt="Uploaded image"
            fill
            className="object-contain"
          />
        </div>
      )}
    </div>
  );
}; 
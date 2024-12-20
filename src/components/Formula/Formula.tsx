import { useEffect, useState } from 'react';
import temml from 'temml';
import { MathMLToLaTeX } from 'mathml-to-latex';

interface FormulaProps {
  source: 'latex' | 'math';
  content: string;
  reference?: string;
}

export const Formula: React.FC<FormulaProps> = ({ source, content, reference }) => {
  const [html, setHtml] = useState<string>('');
  const [valid, setValid] = useState<boolean>(true);

  useEffect(() => {
    const renderFormula = () => {
      if (source === 'latex') {
        try {
          const renderedHtml = temml.renderToString(content);
          setHtml(renderedHtml);
          setValid(true);
        } catch (err) {
          console.error('Invalid LaTeX:', content);
          setHtml(content);
          setValid(false);
        }
      } else {
        // Для MathML контента
        try {
          const latex = MathMLToLaTeX.convert(content);
          const renderedHtml = temml.renderToString(latex);
          setHtml(renderedHtml);
          setValid(true);
        } catch (err) {
          console.error('Invalid MathML:', content);
          setHtml(content);
          setValid(false);
        }
      }
    };

    renderFormula();
  }, [source, content]);

  return (
    <div className="Formula" data-source={source}>
      <div 
        className={`Formula-Content ${!valid ? 'text-red-500' : ''}`}
        dangerouslySetInnerHTML={{ __html: html }} 
      />
      {reference && (
        <div className="Formula-Ref text-sm text-gray-500">
          {reference}
        </div>
      )}
    </div>
  );
}; 
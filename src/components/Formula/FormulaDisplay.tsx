import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface FormulaDisplayProps {
  source?: string;
  content: string;
  reference?: string;
  inline?: boolean;
}

export const FormulaDisplay = ({ source, content, reference, inline = false }: FormulaDisplayProps) => {
  const formula = content.replace(/^\$|\$$/g, '');
  
  return (
    <div className="formula-display">
      {inline ? (
        <InlineMath math={formula} />
      ) : (
        <div className="flex items-center gap-4">
          <BlockMath math={formula} />
          {reference && (
            <div className="text-lg text-gray-600">
              ({reference})
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 
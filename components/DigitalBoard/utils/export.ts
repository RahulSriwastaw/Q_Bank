import Konva from 'konva';
import jsPDF from 'jspdf';

export const exportToImage = () => {
    const stage = Konva.stages.find(s => s.id() === 'main-canvas');
    if (!stage) return;
    
    const dataURL = stage.toDataURL({ pixelRatio: 2 });
    downloadURI(dataURL, 'digital-board.png');
};

export const exportToPDF = () => {
    const stage = Konva.stages.find(s => s.id() === 'main-canvas');
    if (!stage) return;
    
    const dataURL = stage.toDataURL({ pixelRatio: 2 });
    const pdf = new jsPDF('l', 'px', [stage.width(), stage.height()]);
    pdf.addImage(dataURL, 'PNG', 0, 0, stage.width(), stage.height());
    pdf.save('digital-board.pdf');
};

const downloadURI = (uri: string, name: string) => {
    const link = document.createElement('a');
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

import { jsPDF } from 'jspdf';

/**
 * Adds a professional clinic header with logo to a jsPDF instance
 */
export const addClinicHeader = async (doc: jsPDF, clinic: any, title: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add Logo if available
    if (clinic?.logo) {
        try {
            const logoUrl = clinic.logo.startsWith('http')
                ? clinic.logo
                : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${clinic.logo}`;

            await new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = () => {
                    try {
                        const imgWidth = 30;
                        const imgHeight = (img.height * imgWidth) / img.width;
                        doc.addImage(img, 'PNG', 15, 10, imgWidth, imgHeight);
                        resolve(true);
                    } catch (e) {
                        console.warn("Failed to add image to PDF", e);
                        resolve(false);
                    }
                };
                img.onerror = () => {
                    console.warn("Failed to load clinic logo for PDF");
                    resolve(false);
                };
                img.src = logoUrl;
            });
        } catch (e) {
            console.warn("Error processing clinic logo", e);
        }
    }

    // Clinic Name
    doc.setFontSize(22);
    doc.setTextColor(30, 27, 75); // #1e1b4b
    doc.setFont('helvetica', 'bold');
    doc.text(clinic?.name || 'Medical Clinic', 50, 20);

    // Title / Report Type
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(title, 50, 28);

    // Clinic Contact Info (Small)
    doc.setFontSize(9);
    doc.setTextColor(120);
    let contactInfo = clinic?.location || '';
    if (clinic?.contact) contactInfo += ` | Tel: ${clinic.contact}`;
    if (clinic?.email) contactInfo += ` | Email: ${clinic.email}`;
    doc.text(contactInfo, 50, 34);

    // Horizontal Line
    doc.setDrawColor(200);
    doc.line(15, 40, pageWidth - 15, 40);

    return 45; // Return next Y position
};

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Group, Session } from './types';

/**
 * Export groups to PDF
 */
export function exportToPDF(session: Session, groups: Group[]): void {
    const doc = new jsPDF();

    // Title
    const title = session.name || `Session ${session.id || 'Unknown'}`;
    doc.setFontSize(20);
    doc.text(title, 14, 20);

    // Metadata
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(session.createdAt).toLocaleDateString()}`, 14, 30);
    doc.text(`Total Groups: ${groups.length}`, 14, 36);
    doc.text(`Total Participants: ${session.participantCount || groups.reduce((sum, g) => sum + g.members.length, 0)}`, 14, 42);

    let yPosition = 50;

    // Groups
    groups.forEach((group, index) => {
        // Check if we need a new page
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }

        doc.setFontSize(14);
        doc.text(`Group ${index + 1}`, 14, yPosition);
        yPosition += 8;

        const tableData = group.members.map((member, i) => [
            i + 1,
            member.avatar,
            member.name,
        ]);

        autoTable(doc, {
            startY: yPosition,
            head: [['#', 'Avatar', 'Name']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42] },
            margin: { left: 14 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
    });

    // Download
    const filename = `${title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
}

/**
 * Export groups to XLSX
 */
export function exportToXLSX(session: Session, groups: Group[]): void {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
        ['Session Name', session.name || session.id || 'Unknown'],
        ['Date', new Date(session.createdAt).toLocaleDateString()],
        ['Total Groups', groups.length],
        ['Total Participants', session.participantCount || groups.reduce((sum, g) => sum + g.members.length, 0)],
        [],
        ['Group', 'Member Count'],
    ];

    groups.forEach((group, index) => {
        summaryData.push([`Group ${index + 1}`, group.members.length]);
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Individual group sheets
    groups.forEach((group, index) => {
        const groupData = [
            ['#', 'Avatar', 'Name'],
            ...group.members.map((member, i) => [i + 1, member.avatar, member.name]),
        ];

        const groupSheet = XLSX.utils.aoa_to_sheet(groupData);
        XLSX.utils.book_append_sheet(workbook, groupSheet, `Group ${index + 1}`);
    });

    // Download
    const title = session.name || `Session_${session.id || 'Unknown'}`;
    const filename = `${title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
}

/**
 * Copy groups to clipboard as formatted text
 */
export function copyGroupsToClipboard(groups: Group[]): Promise<void> {
    let text = '';

    groups.forEach((group, index) => {
        text += `Group ${index + 1}\n`;
        text += '─'.repeat(30) + '\n';
        group.members.forEach((member, i) => {
            text += `${i + 1}. ${member.avatar} ${member.name}\n`;
        });
        text += '\n';
    });

    return navigator.clipboard.writeText(text);
}

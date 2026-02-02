import { jsPDF } from 'jspdf';

interface CircumstanceLabels {
  [key: string]: string;
}

export const exportToPDF = async (fileName: string = 'accident_report.pdf', formData?: any) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Title
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SPRÁVA O NEHODE', 105, 12, { align: 'center' });

    let yPos = 20;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const maxWidth = 190;
    const colWidth = (maxWidth - 5) / 2;

    const checkNewPage = (height: number) => {
      if (yPos + height > pageHeight - 10) {
        pdf.addPage();
        yPos = 10;
        return true;
      }
      return false;
    };

    const addSection = (title: string, height: number = 8) => {
      checkNewPage(height + 5);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setFillColor(33, 150, 243);
      pdf.rect(margin, yPos, maxWidth, height, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.text(title, margin + 2, yPos + height / 2 + 1, { baseline: 'middle' });
      pdf.setTextColor(0, 0, 0);
      yPos += height + 2;
    };

    const addField = (label: string, value: string = '', width: number = maxWidth, height: number = 6) => {
      checkNewPage(height);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setDrawColor(0, 0, 0);
      pdf.rect(margin, yPos, width, height);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, margin + 1, yPos + 2);
      
      if (value) {
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, margin + width - 2, yPos + 2, { align: 'right' });
      }
      
      yPos += height;
    };

    const addTwoColumnFields = (label1: string, value1: string, label2: string, value2: string, height: number = 6) => {
      checkNewPage(height);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setDrawColor(0, 0, 0);

      // Left column
      pdf.rect(margin, yPos, colWidth, height);
      pdf.text(label1, margin + 1, yPos + 2);
      if (value1) {
        pdf.setFont('helvetica', 'normal');
        pdf.text(value1, margin + colWidth - 2, yPos + 2, { align: 'right' });
      }

      // Right column
      pdf.setFont('helvetica', 'bold');
      pdf.rect(margin + colWidth + 5, yPos, colWidth, height);
      pdf.text(label2, margin + colWidth + 6, yPos + 2);
      if (value2) {
        pdf.setFont('helvetica', 'normal');
        pdf.text(value2, margin + colWidth * 2 + 3, yPos + 2, { align: 'right' });
      }

      yPos += height;
    };

    // Get form data from DOM if not provided
    if (!formData) {
      formData = JSON.parse(localStorage.getItem('accidentReport') || '{}');
    }

    // ===== SECTION 1: ACCIDENT DATE AND LOCATION =====
    addSection('1. Dátum a miesto nehody');

    addTwoColumnFields('Dátum nehody:', formData.section1?.dateOfAccident || '', 'Čas:', formData.section1?.timeOfAccident || '');
    addField('Miesto nehody:', formData.section1?.location || '');
    addTwoColumnFields('Mesto/Obec:', formData.section1?.city || '', 'Štát:', formData.section1?.state || '');

    yPos += 3;

    // ===== SECTION 2: ACCIDENT INFORMATION =====
    addSection('2. Informácie o nehode');

    const yesNo = (val: string) => (val === 'yes' ? '✓ Áno' : val === 'no' ? '✗ Nie' : '');
    
    addTwoColumnFields('Zranenia?', yesNo(formData.section2?.injuries || ''), 'Poškodenie iných vozidiel?', yesNo(formData.section2?.damageOtherVehicles || ''));
    addTwoColumnFields('Poškodenie iného majetku?', yesNo(formData.section2?.damageOtherItems || ''), '', '');

    if (formData.section2?.witnesses) {
      addField('Svedkovia:', formData.section2.witnesses);
    }

    yPos += 3;

    // ===== VEHICLE A =====
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(33, 150, 243);
    pdf.rect(margin, yPos, maxWidth, 7, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.text('VOZIDLO A', margin + 2, yPos + 3.5, { baseline: 'middle' });
    pdf.setTextColor(0, 0, 0);
    yPos += 9;

    if (formData.vehicleA) {
      const vA = formData.vehicleA;

      // Policyholder section
      addSection('6. Poisťovňa / Poistenec', 7);
      addField('Meno a Priezvisko:', (vA.policyholder?.firstname || '') + ' ' + (vA.policyholder?.surname || ''));
      addField('Adresa:', vA.policyholder?.address || '');
      addTwoColumnFields('PSČ:', vA.policyholder?.postalCode || '', 'Štát:', vA.policyholder?.country || '');
      addField('Tel. / E-mail:', vA.policyholder?.phoneEmail || '');
      yPos += 2;

      // Vehicle section
      addSection('7. Vozidlo', 7);
      addTwoColumnFields('Typ vozidla:', vA.vehicle?.vehicleType === 'trailer' ? 'Prívес' : 'Motorové vozidlo', '', '');
      addTwoColumnFields('Značka:', vA.vehicle?.make || '', 'Model:', vA.vehicle?.model || '');
      addField('Registračná značka:', vA.vehicle?.registrationNumber || '');
      addField('Štát registrácie:', vA.vehicle?.countryOfRegistration || '');
      yPos += 2;

      // Insurance section
      addSection('8. Poisťovňa (podľa poistky)', 7);
      addField('Názov poisťovne:', vA.insurance?.insuranceCompanyName || '');
      addTwoColumnFields('Číslo poistky:', vA.insurance?.policyNumber || '', 'Zelená karta:', vA.insurance?.greenCardNumber || '');
      addTwoColumnFields('Platná od:', vA.insurance?.greenCardValidFrom || '', 'Platná do:', vA.insurance?.greenCardValidTo || '');
      addField('Pobočka:', vA.insurance?.branch || '');
      addField('Adresa pobočky:', vA.insurance?.branchAddress || '');
      addTwoColumnFields('Štát pobočky:', vA.insurance?.branchCountry || '', 'Tel. / E-mail:', vA.insurance?.branchPhone || '');
      addTwoColumnFields('Komplexne poistené?', vA.insurance?.comprehensiveInsurance === 'yes' ? '✓ Áno' : 'Nie', '', '');
      yPos += 2;

      // Driver section
      addSection('9. Vodič (podľa vodičského preukazu)', 7);
      addField('Meno a Priezvisko:', (vA.driver?.firstname || '') + ' ' + (vA.driver?.surname || ''));
      addField('Dátum narodenia:', vA.driver?.dateOfBirth || '');
      addField('Adresa:', vA.driver?.address || '');
      addTwoColumnFields('Štát:', vA.driver?.country || '', 'Tel.:', vA.driver?.phone || '');
      addField('Číslo vodičského preukazu:', vA.driver?.licenceNumber || '');
      addTwoColumnFields('Kategória:', vA.driver?.licenceCategory || '', 'Platný do:', vA.driver?.licenceValidUntil || '');
      yPos += 2;

      // Damage and circumstances
      addSection('10. Poškodenie vozidla', 7);
      
      // Add impact markers visualization if they exist
      if (vA.impactMarkers && vA.impactMarkers.length > 0) {
        checkNewPage(35);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Miesta poškodenia vozidla:', margin, yPos);
        yPos += 6;

        // Draw vehicle diagram with impact markers
        const diagramWidth = 60;
        const diagramHeight = 40;
        const diagramX = margin + 5;
        const diagramY = yPos;

        // Draw simplified vehicle outline
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(diagramX, diagramY, diagramWidth, diagramHeight);

        // Draw impact markers on the diagram
        vA.impactMarkers.forEach((marker: any) => {
          const markerX = diagramX + (marker.x / 500) * diagramWidth;
          const markerY = diagramY + (marker.y / 500) * diagramHeight;
          
          // Draw impact point as a circle
          pdf.setFillColor(255, 0, 0);
          pdf.circle(markerX, markerY, 1.5, 'F');
          
          // Draw arrow indicator
          const arrowLength = 5;
          const radians = (marker.rotation * Math.PI) / 180;
          const arrowEndX = markerX + arrowLength * Math.cos(radians);
          const arrowEndY = markerY + arrowLength * Math.sin(radians);
          
          pdf.setDrawColor(255, 0, 0);
          pdf.line(markerX, markerY, arrowEndX, arrowEndY);
        });

        yPos += diagramHeight + 5;
      }
      
      if (vA.visibleDamage) {
        addField('Viditeľné poškodenie:', vA.visibleDamage);
        yPos += 1;
      } else {
        yPos += 2;
      }

      // Circumstances checkboxes
      const circumstances = vA.circumstances || {};
      const circumstanceLabels: CircumstanceLabels = {
        parked: 'Zaparkované',
        stopped: 'Zastavené',
        openedDoor: 'Otvorené dvere',
        parking: 'Parkovanie',
        leavingParkingArea: 'Opúšťanie parkovacieho priestoru',
        enteringParkingArea: 'Vstup do parkovacieho priestoru',
        enteringRoundabout: 'Vstup do kruhového objazdu',
        drivingRoundabout: 'Jazda v kruhovom objazde',
        rearEndCollision: 'Náraz do auta zozadu',
        drivingParallel: 'Jazda vedľa seba',
        changingLanes: 'Zmena jazdného pruhu',
        overtaking: 'Předjíždění',
        turningRight: 'Zatáčka doprava',
        turningLeft: 'Zatáčka doľava',
        reversing: 'Couvanie',
        enteredOppositeLane: 'Vstup do protismeru',
        comingFromRight: 'Príchod zprava',
        failedToYield: 'Nedodržanie priorty',
      };

      let colIndex = 0;

      for (const [key, label] of Object.entries(circumstanceLabels)) {
        if (circumstances[key]) {
          if (colIndex === 0) {
            checkNewPage(6);
          }

          const xPos = colIndex === 0 ? margin + 1 : margin + maxWidth / 2 + 1;

          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.text('✓ ' + label, xPos, yPos);

          colIndex = (colIndex + 1) % 2;
          if (colIndex === 0) {
            yPos += 5;
          }
        }
      }

      if (colIndex !== 0) {
        yPos += 5;
      }

      if (vA.additionalNotes) {
        addField('Dodatočné poznámky:', vA.additionalNotes);
      }

      yPos += 2;
    }

    // ===== VEHICLE B =====
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(255, 193, 7);
    pdf.rect(margin, yPos, maxWidth, 7, 'F');
    pdf.setTextColor(0, 0, 0);
    pdf.text('VOZIDLO B', margin + 2, yPos + 3.5, { baseline: 'middle' });
    yPos += 9;

    if (formData.vehicleB) {
      const vB = formData.vehicleB;
      const circumstanceLabels: CircumstanceLabels = {
        parked: 'Zaparkované',
        stopped: 'Zastavené',
        openedDoor: 'Otvorené dvere',
        parking: 'Parkovanie',
        leavingParkingArea: 'Opúšťanie parkovacieho priestoru',
        enteringParkingArea: 'Vstup do parkovacieho priestoru',
        enteringRoundabout: 'Vstup do kruhového objazdu',
        drivingRoundabout: 'Jazda v kruhovom objazde',
        rearEndCollision: 'Náraz do auta zozadu',
        drivingParallel: 'Jazda vedľa seba',
        changingLanes: 'Zmena jazdného pruhu',
        overtaking: 'Předjíždění',
        turningRight: 'Zatáčka doprava',
        turningLeft: 'Zatáčka doľava',
        reversing: 'Couvanie',
        enteredOppositeLane: 'Vstup do protismeru',
        comingFromRight: 'Príchod zprava',
        failedToYield: 'Nedodržanie priorty',
      };

      // Same structure as Vehicle A
      addSection('6. Poisťovňa / Poistenec', 7);
      addField('Meno a Priezvisko:', (vB.policyholder?.firstname || '') + ' ' + (vB.policyholder?.surname || ''));
      addField('Adresa:', vB.policyholder?.address || '');
      addTwoColumnFields('PSČ:', vB.policyholder?.postalCode || '', 'Štát:', vB.policyholder?.country || '');
      addField('Tel. / E-mail:', vB.policyholder?.phoneEmail || '');
      yPos += 2;

      addSection('7. Vozidlo', 7);
      addTwoColumnFields('Typ vozidla:', vB.vehicle?.vehicleType === 'trailer' ? 'Prívес' : 'Motorové vozidlo', '', '');
      addTwoColumnFields('Značka:', vB.vehicle?.make || '', 'Model:', vB.vehicle?.model || '');
      addField('Registračná značka:', vB.vehicle?.registrationNumber || '');
      addField('Štát registrácie:', vB.vehicle?.countryOfRegistration || '');
      yPos += 2;

      addSection('8. Poisťovňa (podľa poistky)', 7);
      addField('Názov poisťovne:', vB.insurance?.insuranceCompanyName || '');
      addTwoColumnFields('Číslo poistky:', vB.insurance?.policyNumber || '', 'Zelená karta:', vB.insurance?.greenCardNumber || '');
      addTwoColumnFields('Platná od:', vB.insurance?.greenCardValidFrom || '', 'Platná do:', vB.insurance?.greenCardValidTo || '');
      addField('Pobočka:', vB.insurance?.branch || '');
      addField('Adresa pobočky:', vB.insurance?.branchAddress || '');
      addTwoColumnFields('Štát pobočky:', vB.insurance?.branchCountry || '', 'Tel. / E-mail:', vB.insurance?.branchPhone || '');
      addTwoColumnFields('Komplexne poistené?', vB.insurance?.comprehensiveInsurance === 'yes' ? '✓ Áno' : 'Nie', '', '');
      yPos += 2;

      addSection('9. Vodič (podľa vodičského preukazu)', 7);
      addField('Meno a Priezvisko:', (vB.driver?.firstname || '') + ' ' + (vB.driver?.surname || ''));
      addField('Dátum narodenia:', vB.driver?.dateOfBirth || '');
      addField('Adresa:', vB.driver?.address || '');
      addTwoColumnFields('Štát:', vB.driver?.country || '', 'Tel.:', vB.driver?.phone || '');
      addField('Číslo vodičského preukazu:', vB.driver?.licenceNumber || '');
      addTwoColumnFields('Kategória:', vB.driver?.licenceCategory || '', 'Platný do:', vB.driver?.licenceValidUntil || '');
      yPos += 2;

      addSection('10. Poškodenie vozidla', 7);
      
      // Add impact markers visualization if they exist
      if (vB.impactMarkers && vB.impactMarkers.length > 0) {
        checkNewPage(35);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Miesta poškodenia vozidla:', margin, yPos);
        yPos += 6;

        // Draw vehicle diagram with impact markers
        const diagramWidth = 60;
        const diagramHeight = 40;
        const diagramX = margin + 5;
        const diagramY = yPos;

        // Draw simplified vehicle outline
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(diagramX, diagramY, diagramWidth, diagramHeight);

        // Draw impact markers on the diagram
        vB.impactMarkers.forEach((marker: any) => {
          const markerX = diagramX + (marker.x / 500) * diagramWidth;
          const markerY = diagramY + (marker.y / 500) * diagramHeight;
          
          // Draw impact point as a circle
          pdf.setFillColor(255, 0, 0);
          pdf.circle(markerX, markerY, 1.5, 'F');
          
          // Draw arrow indicator
          const arrowLength = 5;
          const radians = (marker.rotation * Math.PI) / 180;
          const arrowEndX = markerX + arrowLength * Math.cos(radians);
          const arrowEndY = markerY + arrowLength * Math.sin(radians);
          
          pdf.setDrawColor(255, 0, 0);
          pdf.line(markerX, markerY, arrowEndX, arrowEndY);
        });

        yPos += diagramHeight + 5;
      }
      
      if (vB.visibleDamage) {
        addField('Viditeľné poškodenie:', vB.visibleDamage);
        yPos += 1;
      } else {
        yPos += 2;
      }

      const circumstancesB = vB.circumstances || {};
      let colIndex = 0;

      for (const [key, label] of Object.entries(circumstanceLabels)) {
        if (circumstancesB[key]) {
          if (colIndex === 0) {
            checkNewPage(6);
          }

          const xPos = colIndex === 0 ? margin + 1 : margin + maxWidth / 2 + 1;

          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.text('✓ ' + label, xPos, yPos);

          colIndex = (colIndex + 1) % 2;
          if (colIndex === 0) {
            yPos += 5;
          }
        }
      }

      if (colIndex !== 0) {
        yPos += 5;
      }

      if (vB.additionalNotes) {
        addField('Dodatočné poznámky:', vB.additionalNotes);
      }

      yPos += 3;
    }

    // ===== SIGNATURES =====
    checkNewPage(30);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(33, 150, 243);
    pdf.rect(margin, yPos, maxWidth, 7, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Podpisy vodičov', margin + 2, yPos + 3.5, { baseline: 'middle' });
    pdf.setTextColor(0, 0, 0);
    yPos += 10;

    // Driver A signature
    if (formData.signatures?.driverA) {
      checkNewPage(25);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Vodič A:', margin, yPos);
      yPos += 8;

      const signImg = formData.signatures.driverA;
      pdf.addImage(signImg, 'PNG', margin, yPos, 40, 15);
      yPos += 18;
    }

    // Driver B signature
    if (formData.signatures?.driverB) {
      checkNewPage(25);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Vodič B:', margin, yPos);
      yPos += 8;

      const signImg = formData.signatures.driverB;
      pdf.addImage(signImg, 'PNG', margin, yPos, 40, 15);
      yPos += 18;
    }

    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

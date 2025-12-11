// ==========================================
//  VOORTGANG INSTELLEN FUNCTIE
// ==========================================

/**
 * Stelt het voortgangspercentage van een student in door de startdatum te berekenen
 * @param {string} studentNaam - Naam van de student
 * @param {number} targetPercentage - Gewenst percentage (0-100)
 * @returns {Object|null} - Object met resultaat of null bij fout
 */
function setStudentProgress(studentNaam, targetPercentage) {
    // Validatie van input
    if (!studentNaam || typeof studentNaam !== 'string') {
        console.error('❌ Ongeldige studentnaam opgegeven');
        return null;
    }
    
    if (typeof targetPercentage !== 'number' || targetPercentage < 0 || targetPercentage > 100) {
        console.error('❌ Percentage moet tussen 0 en 100 liggen');
        return null;
    }
    
    // Controleer of STUDENTEN_DATA bestaat
    if (typeof STUDENTEN_DATA === 'undefined' || !Array.isArray(STUDENTEN_DATA)) {
        console.error('❌ STUDENTEN_DATA array niet gevonden');
        return null;
    }
    
    // Zoek de student
    const student = STUDENTEN_DATA.find(s => 
        s.naam.toLowerCase() === studentNaam.toLowerCase()
    );
    
    if (!student) {
        console.error(`❌ Student "${studentNaam}" niet gevonden in STUDENTEN_DATA`);
        console.log('📋 Beschikbare studenten:', STUDENTEN_DATA.map(s => s.naam).join(', '));
        return null;
    }
    
    // Controleer of constanten bestaan
    if (typeof MONTHS_PRE === 'undefined' || 
        typeof MONTHS_STUDY === 'undefined' || 
        typeof MONTHS_INTERN === 'undefined') {
        console.error('❌ Maand constanten (MONTHS_PRE, MONTHS_STUDY, MONTHS_INTERN) niet gevonden');
        return null;
    }
    
    // Bereken totale duur in maanden
    const totalMonths = student.heeftVoortraject 
        ? MONTHS_PRE + MONTHS_STUDY + MONTHS_INTERN 
        : MONTHS_STUDY + MONTHS_INTERN;
    
    // Bereken hoeveel maanden er verstreken moeten zijn voor dit percentage
    const monthsElapsed = (targetPercentage / 100) * totalMonths;
    
    // Bereken de nieuwe startdatum (nu - verstreken maanden)
    const now = new Date();
    const newStartDate = new Date(now);
    newStartDate.setMonth(newStartDate.getMonth() - monthsElapsed);
    
    // Formatteer naar YYYY-MM-DD
    const formattedDate = newStartDate.toISOString().split('T')[0];
    
    // Bewaar oude waarde voor logging
    const oldStartDate = student.startdatum;
    
    // Update de student
    student.startdatum = formattedDate;
    
    // Sla op in localStorage
    try {
        localStorage.setItem('STUDENTEN_DATA', JSON.stringify(STUDENTEN_DATA));
        console.log('💾 Data opgeslagen in localStorage');
    } catch (e) {
        console.warn('⚠️ Kon niet opslaan in localStorage:', e.message);
    }
    
    // Update UI als functie beschikbaar is
    if (typeof applyFilters === 'function') {
        applyFilters();
        console.log('🔄 UI bijgewerkt');
    }
    
    // Bereken actuele voortgang ter verificatie
    const verification = calculateProgress(student);
    
    // Console output
    console.log('✅ Voortgang succesvol ingesteld!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 Student: ${student.naam}`);
    console.log(`📊 Gewenst percentage: ${targetPercentage}%`);
    console.log(`📊 Daadwerkelijk percentage: ${Math.round(verification.percentage)}%`);
    console.log(`📅 Oude startdatum: ${new Date(oldStartDate).toLocaleDateString('nl-NL')}`);
    console.log(`📅 Nieuwe startdatum: ${new Date(formattedDate).toLocaleDateString('nl-NL')}`);
    console.log(`🎯 Huidige fase: ${verification.phase}`);
    console.log(`⏱️  Totale duur: ${totalMonths} maanden`);
    console.log(`📈 Verstreken: ${Math.round(monthsElapsed)} maanden`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return {
        success: true,
        student: student.naam,
        oldStartDate,
        newStartDate: formattedDate,
        targetPercentage,
        actualPercentage: Math.round(verification.percentage),
        currentPhase: verification.phase,
        totalMonths,
        monthsElapsed: Math.round(monthsElapsed)
    };
}

/**
 * Laadt studentendata uit localStorage
 * @returns {boolean} - True als succesvol geladen
 */
function loadStudentDataFromStorage() {
    try {
        const stored = localStorage.getItem('STUDENTEN_DATA');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                // Update globale STUDENTEN_DATA
                STUDENTEN_DATA.length = 0;
                STUDENTEN_DATA.push(...parsed);
                console.log('✅ Studentendata geladen uit localStorage');
                return true;
            }
        }
        console.log('ℹ️  Geen opgeslagen data gevonden in localStorage');
        return false;
    } catch (e) {
        console.error('❌ Fout bij laden uit localStorage:', e.message);
        return false;
    }
}

/**
 * Reset alle studenten naar originele startdata
 * @returns {boolean} - True als succesvol gereset
 */
function resetStudentData() {
    try {
        localStorage.removeItem('STUDENTEN_DATA');
        console.log('🔄 Studentendata gereset - herlaad de pagina voor originele data');
        return true;
    } catch (e) {
        console.error('❌ Fout bij resetten:', e.message);
        return false;
    }
}

/**
 * Toon overzicht van alle studenten met hun voortgang
 */
function showAllProgress() {
    if (typeof STUDENTEN_DATA === 'undefined' || !Array.isArray(STUDENTEN_DATA)) {
        console.error('❌ STUDENTEN_DATA niet beschikbaar');
        return;
    }
    
    console.log('📊 OVERZICHT ALLE STUDENTEN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    STUDENTEN_DATA.forEach(student => {
        const progress = calculateProgress(student);
        console.log(`👤 ${student.naam.padEnd(12)} | ${Math.round(progress.percentage).toString().padStart(3)}% | ${progress.phase.padEnd(12)} | Start: ${new Date(student.startdatum).toLocaleDateString('nl-NL')}`);
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// ==========================================
//  VOORBEELD GEBRUIK
// ==========================================

// Bij het laden van de pagina, probeer data uit localStorage te laden
document.addEventListener('DOMContentLoaded', function() {
    loadStudentDataFromStorage();
});

// Voorbeeld: Stel Sam in op 75% voortgang
console.log('🎯 Voorbeeld: Sam instellen op 75%');
console.log('');

// Voer dit uit na een korte delay zodat de DOM geladen is
setTimeout(() => {
    setStudentProgress('Sam', 75);
    
    // Toon overzicht
    console.log('');
    showAllProgress();
}, 500);

// ==========================================
//  HANDIGE CONSOLE COMMANDO'S
// ==========================================

console.log('');
console.log('💡 HANDIGE COMMANDO\'S:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('setStudentProgress("Naam", 50)  - Stel voortgang in');
console.log('showAllProgress()               - Toon alle voortgang');
console.log('loadStudentDataFromStorage()    - Herlaad uit localStorage');
console.log('resetStudentData()              - Reset naar origineel');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

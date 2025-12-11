// ==========================================
//  🎓 ADVANCED STUDENT PROGRESS MANAGER
//  Version 2.0 - Premium Edition
// ==========================================

const StudentManager = {
    version: '2.0',
    
    // ==========================================
    //  📊 CORE FUNCTIONS
    // ==========================================
    
    /**
     * Stel voortgang in voor een student
     * @param {string} naam - Naam van de student
     * @param {number} percentage - Gewenst percentage (0-100)
     */
    setProgress(naam, percentage) {
        if (!this._validate(naam, percentage)) return null;
        
        const student = this._findStudent(naam);
        if (!student) return null;
        
        const totalMonths = student.heeftVoortraject 
            ? MONTHS_PRE + MONTHS_STUDY + MONTHS_INTERN 
            : MONTHS_STUDY + MONTHS_INTERN;
        
        const monthsElapsed = (percentage / 100) * totalMonths;
        const newStartDate = new Date();
        newStartDate.setMonth(newStartDate.getMonth() - monthsElapsed);
        
        const oldDate = student.startdatum;
        student.startdatum = newStartDate.toISOString().split('T')[0];
        
        this._save();
        this._refresh();
        
        const result = calculateProgress(student);
        
        console.log(`
╔════════════════════════════════════════════════════════════╗
║  ✅ VOORTGANG BIJGEWERKT                                   ║
╠════════════════════════════════════════════════════════════╣
║  👤 Student:         ${student.naam.padEnd(35)} ║
║  📊 Percentage:      ${Math.round(result.percentage)}% → ${percentage}%${' '.repeat(30 - percentage.toString().length)} ║
║  📅 Oude datum:      ${new Date(oldDate).toLocaleDateString('nl-NL').padEnd(35)} ║
║  📅 Nieuwe datum:    ${new Date(student.startdatum).toLocaleDateString('nl-NL').padEnd(35)} ║
║  🎯 Fase:            ${result.phase.padEnd(35)} ║
║  ⏱️  Totale duur:    ${totalMonths} maanden${' '.repeat(26)} ║
╚════════════════════════════════════════════════════════════╝
        `);
        
        return { success: true, student: student.naam, percentage: Math.round(result.percentage) };
    },
    
    /**
     * Stel meerdere studenten tegelijk in
     * @param {Array} updates - Array van {naam, percentage} objecten
     */
    setBulk(updates) {
        console.log('🔄 Bulk update gestart...\n');
        const results = [];
        
        updates.forEach(({naam, percentage}) => {
            const result = this.setProgress(naam, percentage);
            if (result) results.push(result);
        });
        
        console.log(`\n✅ ${results.length}/${updates.length} studenten bijgewerkt!`);
        return results;
    },
    
    /**
     * Stel startdatum direct in (geen percentage berekening)
     * @param {string} naam - Naam van de student
     * @param {string} datum - Datum in formaat YYYY-MM-DD
     */
    setStartDate(naam, datum) {
        const student = this._findStudent(naam);
        if (!student) return null;
        
        const oldDate = student.startdatum;
        student.startdatum = datum;
        
        this._save();
        this._refresh();
        
        const result = calculateProgress(student);
        
        console.log(`✅ Startdatum bijgewerkt: ${student.naam}`);
        console.log(`   ${new Date(oldDate).toLocaleDateString('nl-NL')} → ${new Date(datum).toLocaleDateString('nl-NL')}`);
        console.log(`   Nieuwe voortgang: ${Math.round(result.percentage)}%`);
        
        return result;
    },
    
    /**
     * Verplaats student naar specifieke fase
     * @param {string} naam - Naam van de student
     * @param {string} fase - 'Voortraject', 'Studie', 'Stage/Werk', of 'Afgerond'
     * @param {number} progressInFase - Percentage binnen de fase (0-100)
     */
    setPhase(naam, fase, progressInFase = 0) {
        const student = this._findStudent(naam);
        if (!student) return null;
        
        const hasPre = student.heeftVoortraject;
        let targetMonths = 0;
        
        switch(fase) {
            case 'Voortraject':
                targetMonths = (progressInFase / 100) * MONTHS_PRE;
                break;
            case 'Studie':
                targetMonths = (hasPre ? MONTHS_PRE : 0) + (progressInFase / 100) * MONTHS_STUDY;
                break;
            case 'Stage/Werk':
                targetMonths = (hasPre ? MONTHS_PRE : 0) + MONTHS_STUDY + (progressInFase / 100) * MONTHS_INTERN;
                break;
            case 'Afgerond':
                targetMonths = (hasPre ? MONTHS_PRE : 0) + MONTHS_STUDY + MONTHS_INTERN;
                break;
            default:
                console.error('❌ Ongeldige fase. Kies: Voortraject, Studie, Stage/Werk, of Afgerond');
                return null;
        }
        
        const totalMonths = hasPre ? MONTHS_PRE + MONTHS_STUDY + MONTHS_INTERN : MONTHS_STUDY + MONTHS_INTERN;
        const percentage = (targetMonths / totalMonths) * 100;
        
        return this.setProgress(naam, percentage);
    },
    
    // ==========================================
    //  📋 OVERVIEW & REPORTING
    // ==========================================
    
    /**
     * Toon overzicht van alle studenten
     */
    showAll() {
        const students = STUDENTEN_DATA.map(s => ({
            ...s,
            progress: calculateProgress(s)
        })).sort((a, b) => b.progress.percentage - a.progress.percentage);
        
        console.log('\n╔═══════════════════════════════════════════════════════════════════════════╗');
        console.log('║  📊 STUDIEVOORTGANG OVERZICHT - ALLE STUDENTEN                            ║');
        console.log('╠═══════════════════════════════════════════════════════════════════════════╣');
        console.log('║  Naam          │  %   │  Fase          │  Startdatum   │  Verwacht Eind ║');
        console.log('╟───────────────┼──────┼────────────────┼───────────────┼────────────────╢');
        
        students.forEach(s => {
            const p = s.progress;
            const icon = this._getPhaseIcon(p.phase);
            console.log(`║  ${icon} ${s.naam.padEnd(10)} │ ${Math.round(p.percentage).toString().padStart(3)}% │ ${p.phase.padEnd(14)} │ ${new Date(s.startdatum).toLocaleDateString('nl-NL', {day:'2-digit',month:'2-digit',year:'numeric'})} │ ${p.forecastDate.padEnd(14)} ║`);
        });
        
        console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');
    },
    
    /**
     * Toon statistieken per fase
     */
    showStats() {
        const stats = { Voortraject: [], Studie: [], 'Stage/Werk': [], Afgerond: [] };
        
        STUDENTEN_DATA.forEach(s => {
            const p = calculateProgress(s);
            if (stats[p.phase]) stats[p.phase].push(s);
        });
        
        console.log('\n╔════════════════════════════════════════════╗');
        console.log('║  📈 STATISTIEKEN PER FASE                  ║');
        console.log('╠════════════════════════════════════════════╣');
        
        Object.entries(stats).forEach(([fase, studenten]) => {
            const icon = this._getPhaseIcon(fase);
            console.log(`║  ${icon} ${fase.padEnd(20)} ${studenten.length.toString().padStart(2)} studenten ║`);
        });
        
        console.log('╠════════════════════════════════════════════╣');
        console.log(`║  👥 TOTAAL:                    ${STUDENTEN_DATA.length} studenten ║`);
        console.log('╚════════════════════════════════════════════╝\n');
    },
    
    /**
     * Toon gedetailleerde info van één student
     * @param {string} naam - Naam van de student
     */
    showDetails(naam) {
        const student = this._findStudent(naam);
        if (!student) return;
        
        const p = calculateProgress(student);
        const start = new Date(student.startdatum);
        const end = new Date(start);
        end.setMonth(end.getMonth() + p.monthsTotal);
        
        console.log(`
╔════════════════════════════════════════════════════════════╗
║  👤 STUDENTDETAILS: ${student.naam.toUpperCase().padEnd(38)} ║
╠════════════════════════════════════════════════════════════╣
║  📅 Startdatum:          ${new Date(student.startdatum).toLocaleDateString('nl-NL').padEnd(30)} ║
║  📅 Verwachte einddatum: ${p.forecastDate.padEnd(30)} ║
║  🚀 Voortraject:         ${student.heeftVoortraject ? 'Ja' : 'Nee'}${' '.repeat(30)} ║
║  📊 Voortgang:           ${Math.round(p.percentage)}%${' '.repeat(30 - Math.round(p.percentage).toString().length)} ║
║  🎯 Huidige fase:        ${p.phase.padEnd(30)} ║
║  ⏱️  Totale duur:        ${p.monthsTotal} maanden${' '.repeat(22)} ║
║  🕐 Volgende fase in:    ${p.daysUntilNextPhase} dagen${' '.repeat(24 - p.daysUntilNextPhase.toString().length)} ║
╠════════════════════════════════════════════════════════════╣
║  📈 PROGRESSIE                                             ║
╠════════════════════════════════════════════════════════════╣
        `);
        
        const barLength = 50;
        const filled = Math.round((p.percentage / 100) * barLength);
        const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
        console.log(`║  ${bar} ${Math.round(p.percentage)}% ║`);
        console.log('╚════════════════════════════════════════════════════════════╝\n');
    },
    
    // ==========================================
    //  🔍 SEARCH & FILTER
    // ==========================================
    
    /**
     * Zoek studenten per fase
     * @param {string} fase - 'Voortraject', 'Studie', 'Stage/Werk', of 'Afgerond'
     */
    findByPhase(fase) {
        const results = STUDENTEN_DATA.filter(s => calculateProgress(s).phase === fase);
        
        console.log(`\n🔍 Studenten in fase "${fase}": ${results.length}\n`);
        results.forEach(s => {
            const p = calculateProgress(s);
            console.log(`   ${this._getPhaseIcon(fase)} ${s.naam} - ${Math.round(p.percentage)}%`);
        });
        console.log('');
        
        return results;
    },
    
    /**
     * Zoek studenten met percentage tussen min en max
     * @param {number} min - Minimum percentage
     * @param {number} max - Maximum percentage
     */
    findByProgress(min, max) {
        const results = STUDENTEN_DATA.filter(s => {
            const p = calculateProgress(s).percentage;
            return p >= min && p <= max;
        });
        
        console.log(`\n🔍 Studenten tussen ${min}% en ${max}%: ${results.length}\n`);
        results.forEach(s => {
            const p = calculateProgress(s);
            console.log(`   ${s.naam} - ${Math.round(p.percentage)}% (${p.phase})`);
        });
        console.log('');
        
        return results;
    },
    
    /**
     * Vind studenten die binnenkort van fase wisselen
     * @param {number} days - Aantal dagen vooruit kijken
     */
    findUpcoming(days = 30) {
        const results = STUDENTEN_DATA.filter(s => {
            const p = calculateProgress(s);
            return p.daysUntilNextPhase > 0 && p.daysUntilNextPhase <= days;
        }).sort((a, b) => calculateProgress(a).daysUntilNextPhase - calculateProgress(b).daysUntilNextPhase);
        
        console.log(`\n🔔 Studenten die binnen ${days} dagen van fase wisselen: ${results.length}\n`);
        results.forEach(s => {
            const p = calculateProgress(s);
            console.log(`   ${s.naam} - ${p.daysUntilNextPhase} dagen (${p.phase} → volgende)`);
        });
        console.log('');
        
        return results;
    },
    
    // ==========================================
    //  💾 DATA MANAGEMENT
    // ==========================================
    
    /**
     * Laad data uit localStorage
     */
    load() {
        try {
            const stored = localStorage.getItem('STUDENTEN_DATA');
            if (stored) {
                const parsed = JSON.parse(stored);
                STUDENTEN_DATA.length = 0;
                STUDENTEN_DATA.push(...parsed);
                console.log('✅ Data geladen uit localStorage');
                this._refresh();
                return true;
            }
            console.log('ℹ️  Geen opgeslagen data gevonden');
            return false;
        } catch (e) {
            console.error('❌ Fout bij laden:', e.message);
            return false;
        }
    },
    
    /**
     * Sla huidige data op in localStorage
     */
    save() {
        return this._save();
    },
    
    /**
     * Reset naar originele data
     */
    reset() {
        if (confirm('⚠️  Weet je zeker dat je alle wijzigingen wilt resetten?')) {
            localStorage.removeItem('STUDENTEN_DATA');
            console.log('🔄 Data gereset - herlaad de pagina');
            setTimeout(() => location.reload(), 1000);
            return true;
        }
        return false;
    },
    
    /**
     * Exporteer data als JSON
     */
    export() {
        const data = JSON.stringify(STUDENTEN_DATA, null, 2);
        console.log('📥 EXPORT DATA:\n');
        console.log(data);
        console.log('\n💾 Kopieer bovenstaande JSON om te backuppen');
        return data;
    },
    
    /**
     * Importeer data van JSON
     * @param {string} jsonString - JSON string met studentendata
     */
    import(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!Array.isArray(data)) throw new Error('Data moet een array zijn');
            
            STUDENTEN_DATA.length = 0;
            STUDENTEN_DATA.push(...data);
            this._save();
            this._refresh();
            
            console.log(`✅ ${data.length} studenten geïmporteerd`);
            return true;
        } catch (e) {
            console.error('❌ Import mislukt:', e.message);
            return false;
        }
    },
    
    // ==========================================
    //  🎨 UTILITIES
    // ==========================================
    
    /**
     * Toon alle beschikbare commando's
     */
    help() {
        console.log(`
╔════════════════════════════════════════════════════════════════════╗
║  🎓 STUDENT MANAGER v${this.version} - COMMAND REFERENCE                    ║
╠════════════════════════════════════════════════════════════════════╣
║  📊 VOORTGANG                                                      ║
║  ─────────────────────────────────────────────────────────────     ║
║  SM.setProgress('Naam', 50)        Stel percentage in             ║
║  SM.setBulk([{naam,percentage}])   Update meerdere studenten      ║
║  SM.setStartDate('Naam', 'YYYY-MM-DD') Stel startdatum in         ║
║  SM.setPhase('Naam', 'Fase', 50)   Verplaats naar fase           ║
║                                                                    ║
║  📋 OVERZICHTEN                                                    ║
║  ─────────────────────────────────────────────────────────────     ║
║  SM.showAll()                      Toon alle studenten            ║
║  SM.showStats()                    Toon statistieken              ║
║  SM.showDetails('Naam')            Toon details van student       ║
║                                                                    ║
║  🔍 ZOEKEN                                                         ║
║  ─────────────────────────────────────────────────────────────     ║
║  SM.findByPhase('Studie')          Zoek per fase                  ║
║  SM.findByProgress(0, 50)          Zoek per percentage            ║
║  SM.findUpcoming(30)               Binnenkort fase-wissel         ║
║                                                                    ║
║  💾 DATA                                                           ║
║  ─────────────────────────────────────────────────────────────     ║
║  SM.load()                         Laad uit localStorage          ║
║  SM.save()                         Sla op in localStorage         ║
║  SM.reset()                        Reset naar origineel           ║
║  SM.export()                       Exporteer JSON                 ║
║  SM.import(json)                   Importeer JSON                 ║
╠════════════════════════════════════════════════════════════════════╣
║  💡 TIP: Gebruik 'SM' als shortcut voor StudentManager            ║
╚════════════════════════════════════════════════════════════════════╝
        `);
    },
    
    // ==========================================
    //  🔧 INTERNAL HELPERS
    // ==========================================
    
    _validate(naam, percentage) {
        if (!naam || typeof naam !== 'string') {
            console.error('❌ Ongeldige naam');
            return false;
        }
        if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
            console.error('❌ Percentage moet tussen 0 en 100 liggen');
            return false;
        }
        return true;
    },
    
    _findStudent(naam) {
        const student = STUDENTEN_DATA.find(s => 
            s.naam.toLowerCase() === naam.toLowerCase()
        );
        if (!student) {
            console.error(`❌ Student "${naam}" niet gevonden`);
            console.log('📋 Beschikbare studenten:', STUDENTEN_DATA.map(s => s.naam).join(', '));
        }
        return student;
    },
    
    _save() {
        try {
            localStorage.setItem('STUDENTEN_DATA', JSON.stringify(STUDENTEN_DATA));
            return true;
        } catch (e) {
            console.warn('⚠️  Kon niet opslaan:', e.message);
            return false;
        }
    },
    
    _refresh() {
        if (typeof applyFilters === 'function') {
            applyFilters();
        }
    },
    
    _getPhaseIcon(fase) {
        const icons = {
            'Voortraject': '🚀',
            'Studie': '📚',
            'Stage/Werk': '💼',
            'Afgerond': '🎓'
        };
        return icons[fase] || '📌';
    }
};

// ==========================================
//  🚀 AUTO-INITIALIZE
// ==========================================

// Shortcut
window.SM = StudentManager;

// Auto-load bij DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => StudentManager.load());
} else {
    StudentManager.load();
}

// ==========================================
//  🎉 WELCOME MESSAGE
// ==========================================

console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║     🎓 STUDENT PROGRESS MANAGER v${StudentManager.version}                         ║
║                                                                    ║
║     ✨ Premium Edition - Geladen en klaar voor gebruik!           ║
║                                                                    ║
║     💡 Type 'SM.help()' voor alle commando's                      ║
║     🚀 Type 'SM.showAll()' voor een overzicht                     ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
`);

// Quick start voorbeeld
console.log('📌 Quick Start:\n');
console.log('   SM.setProgress("Sam", 75)     → Stel voortgang in');
console.log('   SM.showAll()                  → Toon alle studenten');
console.log('   SM.findByPhase("Studie")      → Zoek studenten in studie\n');

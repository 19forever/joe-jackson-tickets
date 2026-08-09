import csv
import os
import re

CSV_FILE = 'joe_jackson_tickets_master_with_setlists.csv'
SCANS_DIR = 'scans'

def run_checks():
    errors = 0
    warnings = 0

    print("=" * 60)
    print("🔍 RUNNING DATA QUALITY CHECKS")
    print("=" * 60)

    if not os.path.exists(CSV_FILE):
        print(f"❌ ERROR: Master CSV file '{CSV_FILE}' not found!")
        return 1

    if not os.path.exists(SCANS_DIR):
        print(f"❌ ERROR: Scans directory '{SCANS_DIR}' not found!")
        return 1

    # Načtení reálných souborů na disku
    actual_files_on_disk = set(os.listdir(SCANS_DIR))
    # Mapa pro kontrolu Case-Sensitivity (např. .webp vs .WEBP)
    actual_files_lowercase = {f.lower(): f for f in actual_files_on_disk}

    referenced_files = set()
    ticket_ids = set()

    with open(CSV_FILE, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        for row_num, row in enumerate(reader, start=2):
            ticket_id = row.get('ID_LISTKU', '').strip()
            sken_field = row.get('SOUBOR_SKEN', '').strip()
            date_field = row.get('DATUM', '').strip()

            # 1. Kontrola duplicity ID
            if ticket_id:
                if ticket_id in ticket_ids:
                    print(f"❌ ERROR [Row {row_num}]: Duplicate ID_LISTKU '{ticket_id}'")
                    errors += 1
                ticket_ids.add(ticket_id)

            # 2. Kontrola existence skenů uvedených v CSV
            if sken_field and sken_field.lower() != 'není k dispozici':
                sken_list = [s.strip() for s in sken_field.split(',') if s.strip()]
                
                for sken_file in sken_list:
                    referenced_files.add(sken_file)
                    
                    if sken_file not in actual_files_on_disk:
                        # Zkontrolujeme, zda nejde o chybějící velká/malá písmena
                        if sken_file.lower() in actual_files_lowercase:
                            correct_name = actual_files_lowercase[sken_file.lower()]
                            print(f"⚠️ WARNING [Row {row_num}]: File casing mismatch for '{sken_file}' (Actual file on disk is '{correct_name}')")
                            warnings += 1
                        else:
                            print(f"❌ ERROR [Row {row_num}] ({ticket_id}): Referenced scan file '{sken_file}' NOT FOUND in scans/ directory!")
                            errors += 1

            # 3. Kontrola formátu pole DATUM (akceptuje YYYY-MM-DD, DD.MM.YYYY, "8th October 2010" i samostatný rok "2010")
            if date_field and date_field.lower() != 'není k dispozici':
                if not re.match(r'^(\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\.\d{1,2}\.\d{4}|\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4})$', date_field):
                    print(f"⚠️ WARNING [Row {row_num}] ({ticket_id}): Unconventional date format in DATUM: '{date_field}'")
                    warnings += 1

    # 4. Kontrola sirotčích obrázků ve složce scans/
    orphan_files = actual_files_on_disk - referenced_files
    # Ignorujeme skryté soubory systému (jako .DS_Store nebo .gitkeep)
    orphan_files = {f for f in orphan_files if not f.startswith('.')}

    if orphan_files:
        print("\n" + "-" * 60)
        print(f"⚠️ FOUND {len(orphan_files)} ORPHAN SCAN FILES (In scans/ folder, but NOT referenced in CSV):")
        for orphan in sorted(orphan_files):
            print(f"  • scans/{orphan}")
        warnings += len(orphan_files)

    print("\n" + "=" * 60)
    print(f"📊 SUMMARY: {errors} Error(s), {warnings} Warning(s)")
    print("=" * 60)

    return 1 if errors > 0 else 0

if __name__ == '__main__':
    exit(run_checks())

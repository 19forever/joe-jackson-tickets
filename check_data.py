import csv
import os
import re
import urllib.request
import urllib.error

CSV_FILE = 'joe_jackson_tickets_cleaned.csv'
SCANS_DIR = './scans'

def load_data(filepath):
    if not os.path.exists(filepath):
        print(f"❌ Soubor {filepath} nebyl nalezen v aktuálním adresáři!")
        return None
    with open(filepath, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        return list(reader)

def check_unique_ids(records):
    print("\n1. Kontrola unikátnosti ID_MEMORABILIA...")
    seen = set()
    duplicates = set()
    for row in records:
        memo_id = row.get('ID_MEMORABILIA', '').strip()
        if memo_id:
            if memo_id in seen:
                duplicates.add(memo_id)
            else:
                seen.add(memo_id)
    if duplicates:
        print(f"❌ Nalezeny duplicitní ID_MEMORABILIA: {list(duplicates)}")
        return False
    print("✅ Všechna ID_MEMORABILIA jsou unikátní.")
    return True

def check_dates(records):
    print("\n2. Kontrola formátu data (YYYY-MM-DD)...")
    date_pattern = re.compile(r'^\d{4}-\d{2}-\d{2}$')
    invalid_dates = []
    for row in records:
        datum = row.get('DATUM', '').strip()
        memo_id = row.get('ID_MEMORABILIA', '')
        if not date_pattern.match(datum):
            invalid_dates.append((memo_id, datum))
    
    if invalid_dates:
        print(f"❌ Chybné formáty data ({len(invalid_dates)} záznamů):")
        for memo_id, datum in invalid_dates:
            print(f"   - {memo_id}: '{datum}'")
        return False
    print("✅ Všechna data mají správný formát YYYY-MM-DD.")
    return True

def check_song_counts(records):
    print("\n3. Kontrola počtu skladeb (POCET_SKLADEB vs SETLIST)...")
    mismatches = []
    for row in records:
        memo_id = row.get('ID_MEMORABILIA', '')
        setlist_str = row.get('SETLIST', '').strip()
        try:
            stored_count = int(row.get('POCET_SKLADEB', 0) or 0)
        except ValueError:
            stored_count = 0
            
        songs = [s.strip() for s in setlist_str.split(',') if s.strip()] if setlist_str else []
        actual_count = len(songs)
        
        if stored_count != actual_count:
            mismatches.append((memo_id, stored_count, actual_count))

    if mismatches:
        print(f"⚠️ Nesoulad v počtu skladeb ({len(mismatches)} záznamů):")
        for memo_id, count, actual in mismatches[:10]:
            print(f"   - {memo_id}: uloženo {count}, v setlistu spočteno {actual}")
        if len(mismatches) > 10:
            print(f"   ... a dalších {len(mismatches) - 10} záznamů.")
        return False
    print("✅ Počet skladeb odpovídá položkám v setlistu.")
    return True

def check_scan_files(records, scans_dir):
    print(f"\n4. Kontrola přítomnosti souborů skenů ve složce '{scans_dir}'...")
    if not os.path.exists(scans_dir):
        print(f"ℹ️ Složka '{scans_dir}' neexistuje lokálně, přesakuji kontrolu souborů na disku.")
        return True

    missing_files = []
    for row in records:
        memo_id = row.get('ID_MEMORABILIA', '')
        scans_str = row.get('SOUBOR_SKEN', '')
        scans = scans_str.split(',') if scans_str else []
        for s in scans:
            s_clean = s.strip()
            if s_clean and not os.path.exists(os.path.join(scans_dir, s_clean)):
                missing_files.append((memo_id, s_clean))

    if missing_files:
        print(f"❌ Chybějící soubory skenů ({len(missing_files)} chybí):")
        for memo_id, filename in missing_files[:10]:
            print(f"   - {memo_id}: {filename}")
        if len(missing_files) > 10:
            print(f"   ... a dalších {len(missing_files) - 10} souborů.")
        return False
    print("✅ Všechny soubory skenů existují v adresáři /scans/.")
    return True

def check_youtube_links(records):
    print("\n5. Kontrola funkčnosti YouTube odkazů...")
    yt_records = [r for r in records if r.get('YOUTUBE_URL', '').strip()]
    
    if not yt_records:
        print("ℹ️ Žádné YouTube odkazy k ověření.")
        return True

    broken_count = 0
    total = len(yt_records)
    print(f"Ověřuji {total} odkazů přes YouTube oEmbed API...")

    for row in yt_records:
        url = row.get('YOUTUBE_URL', '').strip()
        memo_id = row.get('ID_MEMORABILIA', '')
        oembed_url = f"https://www.youtube.com/oembed?url={url}&format=json"
        
        req = urllib.request.Request(oembed_url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status != 200:
                    print(f"   ⚠️ [{memo_id}] Neaktivní video: {url}")
                    broken_count += 1
        except urllib.error.HTTPError as e:
            print(f"   ❌ [{memo_id}] Nefunkční / smazané video (HTTP {e.code}): {url}")
            broken_count += 1
        except Exception as e:
            print(f"   ❌ [{memo_id}] Chyba spojení u videa: {url} ({e})")
            broken_count += 1

    if broken_count == 0:
        print(f"✅ Všech {total} YouTube odkazů je plně funkčních.")
        return True
    else:
        print(f"⚠️ Nalezeno {broken_count} nefunkčních odkazů z celkových {total}.")
        return False

def main():
    print(f"=== SPUŠTĚNÍ KONTROLY DATABÁZE ({CSV_FILE}) ===")
    records = load_data(CSV_FILE)
    if records is None:
        return

    print(f"Načteno celkem {len(records)} záznamů.")

    check_unique_ids(records)
    check_dates(records)
    check_song_counts(records)
    check_scan_files(records, SCANS_DIR)
    check_youtube_links(records)

    print("\n=== KONTROLA DOKONČENA ===")

if __name__ == '__main__':
    main()

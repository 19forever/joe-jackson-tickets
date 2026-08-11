import os
import re
import urllib.request
import urllib.error
import pandas as pd

CSV_FILE = 'joe_jackson_tickets_cleaned.csv'
SCANS_DIR = './scans'

def check_unique_ids(df):
    print("\n1. Kontrola unikátnosti ID_MEMORABILIA...")
    dup_ids = df[df.duplicated('ID_MEMORABILIA', keep=False)]
    if not dup_ids.empty:
        print(f"❌ Nalezeny duplicitní ID_MEMORABILIA: {dup_ids['ID_MEMORABILIA'].unique().tolist()}")
        return False
    print("✅ Všechna ID_MEMORABILIA jsou unikátní.")
    return True

def check_dates(df):
    print("\n2. Kontrola formátu data (YYYY-MM-DD)...")
    date_pattern = re.compile(r'^\d{4}-\d{2}-\d{2}$')
    invalid_dates = df[~df['DATUM'].astype(str).str.match(date_pattern, na=False)]
    if not invalid_dates.empty:
        print(f"❌ Chybné formáty data ({len(invalid_dates)} záznamů):")
        for idx, row in invalid_dates.iterrows():
            print(f"   - {row['ID_MEMORABILIA']}: '{row['DATUM']}'")
        return False
    print("✅ Všechna data mají správný formát YYYY-MM-DD.")
    return True

def check_song_counts(df):
    print("\n3. Kontrola počtu skladeb (POCET_SKLADEB vs SETLIST)...")
    mismatches = []
    for idx, row in df.iterrows():
        setlist = str(row['SETLIST']).strip() if pd.notna(row['SETLIST']) else ''
        count = row['POCET_SKLADEB'] if pd.notna(row['POCET_SKLADEB']) else 0
        songs = [s.strip() for s in setlist.split(',') if s.strip()] if setlist else []
        if len(songs) != count:
            mismatches.append((row['ID_MEMORABILIA'], count, len(songs)))
            
    if mismatches:
        print(f"⚠️ Nesoulad v počtu skladeb ({len(mismatches)} záznamů):")
        for memo_id, count, actual in mismatches[:10]:
            print(f"   - {memo_id}: uloženo {count}, v setlistu spočteno {actual}")
        if len(mismatches) > 10:
            print(f"   ... a dalších {len(mismatches) - 10} záznamů.")
        return False
    print("✅ Počet skladeb odpovídá položkám v setlistu.")
    return True

def check_scan_files(df, scans_dir):
    print(f"\n4. Kontrola přítomnosti souborů skenů ve složce '{scans_dir}'...")
    if not os.path.exists(scans_dir):
        print(f"ℹ️ Složka '{scans_dir}' neexistuje lokálně, přesakuji kontrolu souborů na disku.")
        return True

    missing_files = []
    for idx, row in df.iterrows():
        scans = str(row['SOUBOR_SKEN']).split(',') if pd.notna(row['SOUBOR_SKEN']) else []
        for s in scans:
            s_clean = s.strip()
            if s_clean and not os.path.exists(os.path.join(scans_dir, s_clean)):
                missing_files.append((row['ID_MEMORABILIA'], s_clean))

    if missing_files:
        print(f"❌ Chybějící soubory skenů ({len(missing_files)} chybí):")
        for memo_id, filename in missing_files[:10]:
            print(f"   - {memo_id}: {filename}")
        if len(missing_files) > 10:
            print(f"   ... a dalších {len(missing_files) - 10} souborů.")
        return False
    print("✅ Všechny soubory skenů existují v adresáři /scans/.")
    return True

def check_youtube_links(df):
    print("\n5. Kontrola funkčnosti YouTube odkazů...")
    yt_records = df[df['YOUTUBE_URL'].notna() & (df['YOUTUBE_URL'].astype(str).str.strip() != '')]
    
    if yt_records.empty:
        print("ℹ️ Žádné YouTube odkazy k ověření.")
        return True

    broken_count = 0
    total = len(yt_records)
    print(f"Ověřuji {total} odkazů přes YouTube oEmbed API...")

    for idx, row in yt_records.iterrows():
        url = str(row['YOUTUBE_URL']).strip()
        memo_id = row.get('ID_MEMORABILIA', f'Řádek {idx}')
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
    if not os.path.exists(CSV_FILE):
        print(f"❌ Soubor {CSV_FILE} nebyl nalezen v aktuálním adresáři!")
        return

    df = pd.read_csv(CSV_FILE)
    print(f"Načteno celkem {len(df)} záznamů.")

    check_unique_ids(df)
    check_dates(df)
    check_song_counts(df)
    check_scan_files(df, SCANS_DIR)
    check_youtube_links(df)

    print("\n=== KONTROLA DOKONČENA ===")

if __name__ == '__main__':
    main()

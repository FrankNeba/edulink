import sqlite3
import datetime

def fix_db():
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()
    
    # 1. Create academic_domain if not exists
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS academic_domain (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at DATETIME NOT NULL
    )
    ''')
    
    # 2. Create academic_subdomain if not exists
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS academic_subdomain (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at DATETIME NOT NULL,
        domain_id INTEGER NOT NULL REFERENCES academic_domain(id)
    )
    ''')
    
    now = datetime.datetime.now().isoformat()
    
    # 3. Populate domains
    cursor.execute("INSERT OR IGNORE INTO academic_domain (id, name, description, created_at) VALUES (1, 'General', '', ?)", (now,))
    cursor.execute("INSERT OR IGNORE INTO academic_domain (id, name, description, created_at) VALUES (2, 'Vocational', '', ?)", (now,))
    
    # 4. Populate subdomains
    cursor.execute("INSERT OR IGNORE INTO academic_subdomain (id, name, description, created_at, domain_id) VALUES (1, 'Arts', '', ?, 1)", (now,))
    cursor.execute("INSERT OR IGNORE INTO academic_subdomain (id, name, description, created_at, domain_id) VALUES (2, 'Science', '', ?, 1)", (now,))
    cursor.execute("INSERT OR IGNORE INTO academic_subdomain (id, name, description, created_at, domain_id) VALUES (3, 'Technical', '', ?, 2)", (now,))
    cursor.execute("INSERT OR IGNORE INTO academic_subdomain (id, name, description, created_at, domain_id) VALUES (4, 'Commercial', '', ?, 2)", (now,))
    
    # 5. Update academic_subject data to match IDs
    cursor.execute("UPDATE academic_subject SET domain = '1' WHERE domain IS NULL OR domain NOT IN ('1', '2')")
    
    cursor.execute("UPDATE academic_subject SET sub_domain = '1' WHERE sub_domain = 'ARTS'")
    cursor.execute("UPDATE academic_subject SET sub_domain = '2' WHERE sub_domain = 'SCIENCE'")
    cursor.execute("UPDATE academic_subject SET sub_domain = '3' WHERE sub_domain = 'TECHNICAL'")
    cursor.execute("UPDATE academic_subject SET sub_domain = '4' WHERE sub_domain = 'COMMERCIAL'")
    cursor.execute("UPDATE academic_subject SET sub_domain = '1' WHERE sub_domain IS NULL OR sub_domain NOT IN ('1', '2', '3', '4')")
    
    conn.commit()
    conn.close()
    print("Database structure and data fixed.")

if __name__ == "__main__":
    fix_db()

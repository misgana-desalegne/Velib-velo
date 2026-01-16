import sqlite3
conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(analytics_dailyanalytics)")
columns = cursor.fetchall()
print('DailyAnalytics columns:')
for col in columns:
    nullable = 'NULL' if col[3] == 0 else 'NOT NULL'
    print(f'  {col[1]}: {col[2]} ({nullable})')
conn.close()

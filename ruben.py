import sqlite3
from datetime import datetime

# --- Database setup ---
conn = sqlite3.connect('inventory.db')
cursor = conn.cursor()

cursor.execute('''
CREATE TABLE IF NOT EXISTS computers (
    DOE_num INTEGER PRIMARY KEY,
    technician TEXT NOT NULL,
    user TEXT NOT NULL,
    date TEXT NOT NULL,
    brand TEXT NOT NULL,
    serial TEXT NOT NULL,
    status TEXT DEFAULT 'Open'
)
''')
conn.commit()

# --- Functions ---

def add_record():
    print("\n--- Create New Record ---")
    technician = input("Enter technician's OUN: ")
    user = input("Enter user's OUN: ")
    date = datetime.now().strftime('%m-%d-%Y')
    type = input("PC or Mac? ")
    DOE = input("Enter DOE: ")
    identification = input("Enter computer's name: ")

    cursor.execute('''
    INSERT INTO computers (technician, user, date, brand, serial, identification)
    VALUES (?, ?, ?, ?, ?, ?)
    ''', (technician, user, date, type, DOE, identification))

    conn.commit()
    print("✅ Record added successfully.\n")


def search_records():
    print("\n--- Search Records ---")
    print("Search by: 1) Technician  2) User  3) DOE")
    print("           4) Date        5) Computer Type 6) Computer's Name")
    choice = input("Enter your choice (1-6): ")

    field_map = {
        '1': 'technician',
        '2': 'user',
        '3': 'date',
        '4': 'type',
        '5': 'DOE',
        '6': 'identificiation'
    }

    field = field_map.get(choice)
    if not field:
        print("❌ Invalid option.\n")
        return

    value = input(f"Enter value for {field}: ")

    cursor.execute(f"SELECT * FROM computers WHERE {field} LIKE ?", ('%' + value + '%',))
    records = cursor.fetchall()

    if not records:
        print("🔍 No matching records found.\n")
        return

    for record in records:
        print(f"\nID: {record[0]}")
        print(f"Technician: {record[1]}")
        print(f"User: {record[2]}")
        print(f"Date: {record[3]}")
        print(f"Brand: {record[4]}")
        print(f"Serial: {record[5]}")
        print(f"Identification #: {record[6]}")
        print(f"Status: {record[7]}")
        print("----------------------")

    modify = input("Would you like to update or close a record? (y/n): ").lower()
    if modify == 'y':
        record_id = input("Enter the ID of the record to update/close: ")
        update_menu(record_id)


def update_menu(record_id):
    print("\nWhat would you like to do?")
    print("1) Update Record")
    print("2) Mark as Complete")
    print("3) Cancel")
    choice = input("Enter choice: ")

    if choice == '1':
        field = input("Enter field to update (technician/user/date/brand/serial/identification): ")
        if field not in ['technician', 'user', 'date', 'brand', 'serial', 'identification']:
            print("❌ Invalid field.")
            return
        value = input(f"Enter new value for {field}: ")
        cursor.execute(f"UPDATE computers SET {field} = ? WHERE id = ?", (value, record_id))
        conn.commit()
        print("✅ Record updated.\n")
    elif choice == '2':
        cursor.execute("UPDATE computers SET status = 'Complete' WHERE id = ?", (record_id,))
        conn.commit()
        print("✅ Record marked as complete.\n")
    else:
        print("❎ Cancelled.\n")


def main():
    while True:
        print("Welcome to Computer Loaner Database")
        print("1) Create New Record")
        print("2) Search/View/Edit Records")
        print("3) Exit")

        option = input("Enter your choice (1-3): ")
        if option == '1':
            add_record()
        elif option == '2':
            search_records()
        elif option == '3':
            print("Exiting program. Goodbye!")
            break
        else:
            print("❌ Invalid choice, try again.\n")

if __name__ == "__main__":
    main()

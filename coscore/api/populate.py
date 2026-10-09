import frappe
import json

def run_populate():
    # 1. Clear existing Thanas
    existing_thanas = frappe.get_all('Coscore Thana', pluck='name')
    print(f"Deleting {len(existing_thanas)} existing Thanas...")
    for t_name in existing_thanas:
        frappe.delete_doc('Coscore Thana', t_name, force=1, ignore_permissions=True)
    frappe.db.commit()
    print("Old Thanas deleted successfully.")

    # 2. Load the comprehensive JSON
    json_path = '/tmp/node_modules/bd-geo-address/db/mongodb/bangladesh-address.json'
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    inserted_thanas = 0
    thana_names = set()

    # 3. Ensure all Districts exist
    for district in data.get('districts', []):
        d_name = district.get('name')
        if not d_name: continue
        if not frappe.db.exists('Coscore District', d_name):
            try:
                frappe.get_doc({
                    'doctype': 'Coscore District',
                    'district_name': d_name
                }).insert(ignore_permissions=True)
                frappe.db.commit()
                print(f"Inserted missing District: {d_name}")
            except Exception as e:
                print(f"Error inserting district {d_name}: {e}")

    # We will build a list of (thana_name, district_name) from all possible sources
    areas_to_insert = set()

    # Source A: 'thanas'
    for thana_obj in data.get('thanas', []):
        t = thana_obj.get('thana')
        d = thana_obj.get('district')
        if t and d:
            areas_to_insert.add((t.strip(), d.strip()))

    # Source B: 'postalCodes' (this contains metropolitan thanas like Palton, Cantonment)
    for pc_obj in data.get('postalCodes', []):
        t = pc_obj.get('upazilaName')
        d = pc_obj.get('districtName')
        if t and d:
            areas_to_insert.add((t.strip(), d.strip()))

    print(f"Found {len(areas_to_insert)} unique Thanas/Upazilas across all datasets.")

    for thana_raw, district_name in sorted(areas_to_insert):
        # Handle duplicates across districts (e.g. Shibganj)
        if thana_raw in thana_names:
            thana_name = f"{thana_raw} ({district_name})"
        else:
            thana_name = thana_raw
            thana_names.add(thana_name)

        try:
            doc = frappe.get_doc({
                'doctype': 'Coscore Thana',
                'thana_name': thana_name,
                'district': district_name
            })
            doc.insert(ignore_permissions=True)
            inserted_thanas += 1
        except Exception as e:
            print(f"Failed to insert {thana_name} (District: {district_name}): {e}")

    frappe.db.commit()
    print(f"Successfully inserted {inserted_thanas} unique Thanas/Upazilas.")

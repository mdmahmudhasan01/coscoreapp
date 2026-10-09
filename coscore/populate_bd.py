import requests
import frappe
import json
import re
import os

def clean_json(text):
    # The JSON from this source is a JSON exported from PHPMyAdmin. 
    # It has a strange format with lines like:
    # {"type":"table","name":"districts","database":"bd_geo_code","data":
    # [
    # {"id":"1",...}
    # ]}
    lines = text.strip().split('\n')
    for i, line in enumerate(lines):
        if line.startswith('{"type":"table"') and '"data":' in line:
            # We want everything after this line until the matching closing brace, but simpler:
            # The data is essentially on the following lines between [ and ]
            pass
            
    # Simple regex extraction for the array
    match = re.search(r'"data":\s*(\[\s*\{.*?\}\s*\])', text, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    return []

def run():
    print("Fetching districts...")
    districts_req = requests.get("https://raw.githubusercontent.com/nuhil/bangladesh-geocode/master/districts/districts.json")
    districts_data = clean_json(districts_req.text)
    
    print("Fetching upazilas...")
    upazilas_req = requests.get("https://raw.githubusercontent.com/nuhil/bangladesh-geocode/master/upazilas/upazilas.json")
    upazilas_data = clean_json(upazilas_req.text)
    
    print(f"Found {len(districts_data)} districts and {len(upazilas_data)} upazilas.")
    
    # Map district id to district name
    district_map = {}
    try:
        # Insert Districts
        for d in districts_data:
            district_name = d.get('name')
            district_map[d.get('id')] = district_name
            
            if not frappe.db.exists("Coscore District", district_name):
                doc = frappe.get_doc({
                    "doctype": "Coscore District",
                    "name": district_name,
                    "district_name": district_name,
                    "name_en": district_name,
                    "name_bn": d.get('bn_name', ''),
                    "is_active": 1
                })
                doc.insert(ignore_permissions=True)
                
        # Insert Thanas (Upazilas)
        for u in upazilas_data:
            thana_name = u.get('name')
            district_id = u.get('district_id')
            district_name = district_map.get(district_id)
            
            if district_name:
                # Name will be auto-generated or set
                # Avoid duplicates
                if not frappe.db.exists("Coscore Thana", {"thana_name": thana_name, "district": district_name}):
                    # Check if thana_name is already used by a different district
                    if frappe.db.exists("Coscore Thana", {"thana_name": thana_name}):
                        thana_name = f"{thana_name} ({district_name})"
                        
                    doc = frappe.get_doc({
                        "doctype": "Coscore Thana",
                        "district": district_name,
                        "thana_name": thana_name,
                        "name_en": thana_name,
                        "name_bn": u.get('bn_name', ''),
                        # Shipping logic: 60 for Dhaka, 120 outside
                        "delivery_charge_inside": 60 if district_name == "Dhaka" else 120,
                        "delivery_charge_outside": 120,
                        "delivery_charge_sub": 100,
                        "is_active": 1
                    })
                    doc.insert(ignore_permissions=True)
                    
        frappe.db.commit()
        print("Successfully populated BD geo data.")
    except Exception as e:
        frappe.db.rollback()
        print(f"Error: {str(e)}")
    finally:
        frappe.destroy()

if __name__ == "__main__":
    run()

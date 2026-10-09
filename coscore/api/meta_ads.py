import frappe
import requests
import json
from frappe.utils import now_datetime, add_days, today

@frappe.whitelist(allow_guest=True)
def sync_meta_ads_performance():
	"""
	Whitelisted endpoint to pull performance metrics from the Meta Marketing API
	and save them into the Coscore Ad Performance DocType.
	"""
	meta_access_token = frappe.conf.get("meta_marketing_access_token")
	meta_ad_account_id = frappe.conf.get("meta_ad_account_id") # e.g. "act_123456789"
	
	if not meta_access_token or not meta_ad_account_id:
		# Sandbox/Mock Mode: generate mock data for demo if credentials are missing
		frappe.log_error("Meta Marketing API credentials missing. Syncing mock performance data for demonstration.", "Coscore Meta Ads Sync Warning")
		sync_mock_ads_performance()
		return {"status": "success", "message": "Synced mock ad performance metrics successfully"}

	# Live Mode: Call Meta Marketing API
	url = f"https://graph.facebook.com/v19.0/{meta_ad_account_id}/insights"
	params = {
		"access_token": meta_access_token,
		"level": "ad",
		"fields": "campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,clicks,actions",
		"date_preset": "last_30d",
		"time_increment": 1
	}

	try:
		res = requests.get(url, params=params, timeout=15)
		if res.status_code == 200:
			data = res.json().get("data", [])
			count = 0
			for entry in data:
				# Extract conversions (actions: 'purchase')
				conversions = 0
				actions = entry.get("actions", [])
				for act in actions:
					if act.get("action_type") == "purchase":
						conversions = int(act.get("value", 0))
						break
				
				spend = float(entry.get("spend", 0.0))
				clicks = int(entry.get("clicks", 0))
				impressions = int(entry.get("impressions", 0))
				cpa = spend / conversions if conversions > 0 else 0.0
				roas = (conversions * 1500.0) / spend if spend > 0 else 0.0 # estimate ROAS

				# Insert or update
				campaign_id = entry.get("campaign_id")
				ad_id = entry.get("ad_id")
				date = entry.get("date_start") or today()
				
				# Generate unique name/id for record
				name = f"{ad_id}-{date}"
				
				if frappe.db.exists("Coscore Ad Performance", name):
					perf = frappe.get_doc("Coscore Ad Performance", name)
				else:
					perf = frappe.new_doc("Coscore Ad Performance")
					perf.name = name
					perf.campaign_id = campaign_id
					perf.ad_id = ad_id
					perf.date = date
					
				perf.campaign_name = entry.get("campaign_name")
				perf.adset_id = entry.get("adset_id")
				perf.adset_name = entry.get("adset_name")
				perf.ad_name = entry.get("ad_name")
				perf.spend = spend
				perf.impressions = impressions
				perf.clicks = clicks
				perf.conversions = conversions
				perf.roas = roas
				perf.cpa = cpa
				perf.synced_at = now_datetime()
				
				perf.save(ignore_permissions=True)
				count += 1
				
			frappe.db.commit()
			return {"status": "success", "message": f"Successfully synced {count} ad performance records from Meta API."}
		else:
			frappe.log_error(f"Meta Marketing API error: {res.text}", "Coscore Meta Ads Sync Error")
			return {"status": "error", "message": f"Meta API Error: {res.status_code}"}
	except Exception as e:
		frappe.log_error(f"Failed to sync Meta Ads performance: {str(e)}", "Coscore Meta Ads Sync Error")
		return {"status": "error", "message": str(e)}

def sync_mock_ads_performance():
	"""
	Scaffolds standard mock ad performance rows for testing.
	"""
	mock_data = [
		{
			"campaign_id": "CAMP_001",
			"campaign_name": "Lookzene Brand Awareness July",
			"adset_id": "SET_001",
			"adset_name": "Skincare Enthusiasts BD",
			"ad_id": "AD_001",
			"ad_name": "Glass Skin Serum Creative Video",
			"spend": 120.0,
			"impressions": 15000,
			"clicks": 450,
			"conversions": 12,
			"roas": 2.5,
			"cpa": 10.0
		},
		{
			"campaign_id": "CAMP_002",
			"campaign_name": "Lookzene Conversion Funnel Products",
			"adset_id": "SET_002",
			"adset_name": "K-Beauty Fans Dhaka Metro",
			"ad_id": "AD_002",
			"ad_name": "Centella Ampoule Dynamic Carousel",
			"spend": 350.0,
			"impressions": 48000,
			"clicks": 1800,
			"conversions": 48,
			"roas": 4.1,
			"cpa": 7.29
		},
		{
			"campaign_id": "CAMP_002",
			"campaign_name": "Lookzene Conversion Funnel Products",
			"adset_id": "SET_002",
			"adset_name": "K-Beauty Fans Dhaka Metro",
			"ad_id": "AD_003",
			"ad_name": "COSRX Snail Essence Single Item Image",
			"spend": 80.0,
			"impressions": 8500,
			"clicks": 210,
			"conversions": 3,
			"roas": 1.2,
			"cpa": 26.66
		}
	]

	for i in range(5):
		date_str = add_days(today(), -i)
		for entry in mock_data:
			name = f"{entry['ad_id']}-{date_str}"
			if frappe.db.exists("Coscore Ad Performance", name):
				perf = frappe.get_doc("Coscore Ad Performance", name)
			else:
				perf = frappe.new_doc("Coscore Ad Performance")
				perf.name = name
				perf.campaign_id = entry["campaign_id"]
				perf.ad_id = entry["ad_id"]
				perf.date = date_str
				
			perf.campaign_name = entry["campaign_name"]
			perf.adset_id = entry["adset_id"]
			perf.adset_name = entry["adset_name"]
			perf.ad_name = entry["ad_name"]
			# Add slight random variations per date
			day_variation = (1.0 + (i % 3 - 1) * 0.1)
			perf.spend = float(entry["spend"]) * day_variation
			perf.impressions = int(entry["impressions"] * day_variation)
			perf.clicks = int(entry["clicks"] * day_variation)
			perf.conversions = int(entry["conversions"] * day_variation)
			perf.roas = float(entry["roas"]) * (0.9 + (i % 2) * 0.2)
			perf.cpa = perf.spend / perf.conversions if perf.conversions > 0 else 0.0
			perf.synced_at = now_datetime()
			
			perf.save(ignore_permissions=True)
			
	frappe.db.commit()

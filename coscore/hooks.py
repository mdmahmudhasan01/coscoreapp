app_name = "coscore"
app_title = "Coscore"
app_publisher = "Coscore Team"
app_description = "Coscore Ecommerce Integration App"
app_email = "info@cosecore.local"
app_license = "mit"

required_apps = ["erpnext"]

website_redirects = [
	{"source": "/", "target": "/app"}
]


fixtures = [
	{
		"dt": "Role",
		"filters": [["name", "in", ["Coscore Manager"]]]
	},
	{
		"dt": "Custom Field",
		"filters": [["module", "=", "Coscore"]]
	},
	{
		"dt": "Property Setter",
		"filters": [["module", "=", "Coscore"]]
	},
	{
		"dt": "Dashboard",
		"filters": [["module", "=", "Coscore"]]
	},
	{
		"dt": "Dashboard Chart",
		"filters": [["module", "=", "Coscore"]]
	},
	{
		"dt": "Number Card",
		"filters": [["module", "=", "Coscore"]]
	},
	{
		"dt": "Print Format",
		"filters": [["module", "=", "Coscore"]]
	},
	{
		"dt": "Workspace",
		"filters": [["title", "=", "Coscore"]]
	}
]

doc_events = {
	"Sales Order": {
		"on_submit": "coscore.api.orders.send_order_notifications"
	},
	"Payment Entry": {
		"on_submit": "coscore.utils.tracking.on_payment_entry_submit_purchase_tracking"
	},
	"Sales Invoice": {
		"validate": "coscore.utils.validation.sales_invoice_mobile_validation",
		"on_submit": "coscore.utils.courier.sync_sales_invoice_to_courier",
		"on_payment_success": "coscore.utils.payment.handle_payment_callback"
	},
	"Item Group": {
		"on_update": "coscore.utils.item_group.sync_item_group_to_header_menu",
		"on_trash": "coscore.utils.item_group.sync_item_group_to_header_menu"
	},
	"Item": {
		"on_update": "coscore.utils.item_group.sync_item_to_coscore_product",
		"on_trash": "coscore.utils.item_group.sync_item_to_coscore_product"
	}
}

scheduler_events = {
	"cron": {
		"*/30 * * * *": [
			"coscore.utils.courier.poll_courier_tracking_statuses"
		]
	}
}



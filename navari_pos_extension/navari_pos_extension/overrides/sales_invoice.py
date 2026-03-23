import frappe
from frappe import _


class CustomSalesInvoice:
	def validate_pos_opening_entry(self):
		opening_entries = frappe.get_all(
			"POS Opening Entry",
			fields=["name", "period_start_date"],
			filters={"pos_profile": self.pos_profile, "status": "Open"},
			order_by="period_start_date desc",
		)
		if not opening_entries:
			frappe.throw(
				title=_("POS Opening Entry Missing"),
				msg=_("No open POS Opening Entry found for POS Profile {0}.").format(
					frappe.bold(self.pos_profile)
				),
			)


def validate_sales_person_on_submit(doc, method=None):
    """
    Check if Sales Person is required for POS transactions and validate before submitting the Sales Invoice
    """
    if not doc.is_pos:
        return

    if not doc.pos_profile:
        return

    require_sales_person = frappe.db.get_value(
        "POS Profile",
        doc.pos_profile,
        "custom_require_sales_person",
    )

    # If setting is enabled, check Sales Team table
    if require_sales_person:
        if not doc.sales_team or len(doc.sales_team) == 0:
            frappe.throw(
                _(
                    "Sales person is mandatory to complete this sale. Please enter your POS PIN"
                )
            )

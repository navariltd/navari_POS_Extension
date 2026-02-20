frappe.provide("pos_customization");

pos_customization.get_device_id = function () {
	let device_id = localStorage.getItem("pos_device_id");
	if (!device_id) {
		device_id = "device_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
		localStorage.setItem("pos_device_id", device_id);
	}
	return device_id;
};

pos_customization.current_salesperson = null;

frappe.ui.form.on("Sales Invoice", {
	refresh: function (frm) {
		add_salesperson_auth_section(frm);
	},

	onload: function (frm) {
		const remember_preference = localStorage.getItem("pos_remember_salesperson");
		const should_remember =
			remember_preference === null ? true : remember_preference === "true";
		if (!should_remember) {
			clear_salesperson_cache();
			clear_sales_team(frm);
			$("#salesperson-card").hide();
			$("#pin-input-section").show();
			pos_customization.current_salesperson = null;
		}
	},

	before_save: function (frm) {
		clear_sales_team(frm);
		if (pos_customization.current_salesperson) {
			add_salesperson_to_sales_team(frm, pos_customization.current_salesperson);
		}
	},
});

function add_salesperson_auth_section(frm) {
	const $payment_section = $(".payment-container-right");

	if ($payment_section.find(".salesperson-auth-section").length > 0) {
		return;
	}

	const remember_preference = localStorage.getItem("pos_remember_salesperson");
	const should_remember = remember_preference === null ? true : remember_preference === "true";

	const $auth_section = $(`
        <div class="salesperson-auth-section" style="border-radius: 6px;">
			<p class="section-label">${__("Sales Person")}</p>
            <!-- Remember Checkbox -->
            <div class="form-group" style="margin-bottom: 10px;">
                <label style="display: flex; align-items: center; cursor: pointer; font-weight: 500;">
                    <input type="checkbox" id="remember-salesperson-checkbox" 
                        ${should_remember ? "checked" : ""} 
                        style="margin-right: 8px; width: 16px; height: 16px; cursor: pointer;">
                    <span>${__("Remember Sales Person")}</span>
                </label>
            </div>
            
            <!-- Salesperson Card (shown when remembered) -->
            <div id="salesperson-card" style="display: none; padding: 12px; background-color: var(--fg-color); box-shadow: var(--shadow-base); border-radius: 4px; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600;  font-size: 14px;" id="salesperson-display-name">--</div>
                        <div style="font-size: 12px; margin-top: 2px;" id="salesperson-display-id">--</div>
                    </div>
                    <button class="btn btn-xs btn-default" id="change-salesperson-btn" style="padding: 4px 12px;">
                        <svg style="width: 12px; height: 12px; margin-right: 4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        Change
                    </button>
                </div>
            </div>
            
            <!-- PIN Input Section (shown when not remembered or changing) -->
            <div id="pin-input-section" style="display: none;">
                <div class="form-group" style="margin-bottom: 10px;">
                    <label style="font-weight: 500; margin-bottom: 5px; display: block; font-size: 13px;">${__("Enter Your 4-Digit PIN")}</label>
                    <div style="display: flex; gap: 8px; align-items: flex-start;">
                        <input 
                            type="password" 
                            id="salesperson-pin-input" 
                            class="form-control" 
                            maxlength="4" 
                            pattern="[0-9]{4}"
                            placeholder="••••"
                            style="width: 120px; font-size: 18px; letter-spacing: 4px; text-align: center; font-weight: bold;"
                            autocomplete="off">
                        <button class="btn btn-primary btn-sm" id="verify-pin-btn" style="padding: 6px 16px;">
                            <svg style="width: 14px; height: 14px; margin-right: 4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Verify
                        </button>
                    </div>
                </div>
                <div id="pin-error-message" style="display: none; font-size: 12px; margin-top: 5px; padding: 8px; background:  border-left: 3px solid #e74c3c; border-radius: 3px;">
                    <strong>${__("Error")}:</strong> <span id="pin-error-text"></span>
                </div>
            </div>
            
            <!-- Loading Indicator -->
            <div id="salesperson-loading" style="display: none; text-align: center; padding: 10px; ">
                <div class="spinner-border spinner-border-sm" role="status" style="margin-right: 8px;">
                    <span class="sr-only">${__("Loading...")}</span>
                </div>
                ${__("Verifying...")}
            </div>
        </div>
    `);

	// Insert before the numpad container
	const $insert_point = $payment_section.find(".fields-numpad-container");
	if ($insert_point.length) {
		$insert_point.before($auth_section);
	} else {
		$payment_section.prepend($auth_section);
	}

	bind_salesperson_events(frm);
	check_remembered_salesperson(frm);
}

function bind_salesperson_events(frm) {
	// Remember checkbox change
	$(document)
		.off("change", "#remember-salesperson-checkbox")
		.on("change", "#remember-salesperson-checkbox", function () {
			const is_checked = $(this).is(":checked");

			localStorage.setItem("pos_remember_salesperson", is_checked);

			if (!is_checked) {
				clear_salesperson_cache();
				clear_sales_team(frm);
				$("#salesperson-card").hide();
				$("#pin-input-section").show();
				$("#salesperson-pin-input").val("").focus();
				pos_customization.current_salesperson = null;
			} else {
				check_remembered_salesperson(frm);
			}
		});

	// Change salesperson button
	$(document)
		.off("click", "#change-salesperson-btn")
		.on("click", "#change-salesperson-btn", function () {
			if (pos_customization.current_salesperson) {
				clear_sales_team(frm);
				pos_customization.current_salesperson = null;
			}

			$("#salesperson-card").hide();
			$("#pin-input-section").show();
			$("#pin-error-message").hide();
			$("#salesperson-pin-input").val("").focus();
		});

	// Verify PIN button
	$(document)
		.off("click", "#verify-pin-btn")
		.on("click", "#verify-pin-btn", function () {
			verify_salesperson_pin(frm);
		});

	// Enter key on PIN input
	$(document)
		.off("keypress", "#salesperson-pin-input")
		.on("keypress", "#salesperson-pin-input", function (e) {
			if (e.which === 13) {
				e.preventDefault();
				verify_salesperson_pin(frm);
			}

			const char = String.fromCharCode(e.which);
			if (!/[0-9]/.test(char)) {
				e.preventDefault();
			}
		});

	// Auto-format PIN input (show dots)
	$(document)
		.off("input", "#salesperson-pin-input")
		.on("input", "#salesperson-pin-input", function () {
			$("#pin-error-message").hide();
		});
}

function check_remembered_salesperson(frm) {
	const remember_checked = $("#remember-salesperson-checkbox").is(":checked");

	if (!remember_checked) {
		$("#pin-input-section").show();
		return;
	}

	const device_id = pos_customization.get_device_id();

	$("#salesperson-loading").show();
	$("#pin-input-section").hide();
	$("#salesperson-card").hide();

	frappe.call({
		method: "navari_pos_extension.navari_pos_extension.api.salesperson_auth.get_remembered_salesperson",
		args: {
			device_id: device_id,
		},
		callback: function (r) {
			$("#salesperson-loading").hide();

			if (r.message && r.message.success) {
				display_salesperson_card(r.message.salesperson, r.message.salesperson_name);
				pos_customization.current_salesperson = r.message.salesperson;

				add_salesperson_to_sales_team(frm, r.message.salesperson);
			} else {
				$("#pin-input-section").show();
			}
		},
		error: function () {
			$("#salesperson-loading").hide();
			$("#pin-input-section").show();
		},
	});
}

function verify_salesperson_pin(frm) {
	const pin = $("#salesperson-pin-input").val();

	if (!pin || pin.length !== 4) {
		show_pin_error(__("Please enter a 4-digit PIN"));
		return;
	}

	if (!/^\d{4}$/.test(pin)) {
		show_pin_error(__("PIN must contain only numbers"));
		return;
	}

	const device_id = pos_customization.get_device_id();

	$("#salesperson-loading").show();
	$("#pin-input-section").hide();
	$("#pin-error-message").hide();

	frappe.call({
		method: "navari_pos_extension.navari_pos_extension.api.salesperson_auth.verify_pin",
		args: {
			pin: pin,
			device_id: device_id,
		},
		callback: function (r) {
			$("#salesperson-loading").hide();

			if (r.message && r.message.success) {
				display_salesperson_card(r.message.salesperson, r.message.salesperson_name);
				pos_customization.current_salesperson = r.message.salesperson;

				add_salesperson_to_sales_team(frm, r.message.salesperson);

				$("#salesperson-pin-input").val("");
				frappe.show_alert(
					{
						message: __("Welcome, {0}!", [r.message.salesperson_name]),
						indicator: "green",
					},
					3,
				);
			} else {
				$("#pin-input-section").show();
				show_pin_error(__(r.message.message) || __("Invalid PIN. Please try again."));
				$("#salesperson-pin-input").val("").focus();
			}
		},
		error: function (r) {
			$("#salesperson-loading").hide();
			$("#pin-input-section").show();
			show_pin_error(__(r.message.message) || __("An error occurred. Please try again."));
			$("#salesperson-pin-input").val("").focus();
		},
	});
}

function display_salesperson_card(salesperson, salesperson_name) {
	$("#salesperson-display-name").text(salesperson_name);
	$("#salesperson-display-id").text(salesperson);
	$("#salesperson-card").show();
	$("#pin-input-section").hide();
}

function show_pin_error(message) {
	$("#pin-error-text").text(message);
	$("#pin-error-message").show();
}

function clear_salesperson_cache() {
	const device_id = pos_customization.get_device_id();

	frappe.call({
		method: "navari_pos_extension.navari_pos_extension.api.salesperson_auth.clear_remembered_salesperson",
		args: {
			device_id: device_id,
		},
		callback: function (r) {},
	});
}

function add_salesperson_to_sales_team(frm, salesperson) {
	if (!salesperson) return;

	if (!frm.doc.sales_team) {
		frm.doc.sales_team = [];
	}

	const exists = frm.doc.sales_team.some((row) => row.sales_person === salesperson);

	if (!exists) {
		clear_sales_team(frm);

		const row = frappe.model.add_child(frm.doc, "Sales Team", "sales_team");
		row.sales_person = salesperson;
		row.allocated_percentage = 100;

		frm.refresh_field("sales_team");
	}
}

function clear_sales_team(frm) {
	if (!frm.doc.sales_team || frm.doc.sales_team.length === 0) {
		return;
	}

	frm.doc.sales_team = [];
	frm.refresh_field("sales_team");
}

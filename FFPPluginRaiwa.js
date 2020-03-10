(function () {
	/* FIORI FRAMEWORK PAGE PLUGIN */
	'use strict';
	jQuery.sap.declare("com.quindata.cp.ffp.plugins.FFPPluginRaiwa");
	jQuery.sap.require("sap.ffp.utils.ExtensionUtils");
	jQuery.sap.require("sap.ushell.services.AppConfiguration");
	jQuery.sap.require("sap.ushell.services.Container");

	var bShop = false;
	
	var oPrivacyButton = new sap.m.Button({
		text: "Datenschutz",
		press: function () {
			window.open("/datenschutz/info/index.html");
		}
	});

	var oLegalDisclosureButton = new sap.m.Button({
		text: "Impressum",
		press: function () {
			window.open("/impressum/info/index.html");
		}
	});

	var oFooterBar = new sap.m.Bar({
		contentRight: [oPrivacyButton, oLegalDisclosureButton]
	});

	var checkMembership = function () {
		var sServer = document.location.protocol + "//" + document.location.host;
		var sGetCustomersDivisionServlet = sServer + "/servlets/kp/flp/ume/CheckConstructionWebsiteMembershipServlet";

		$.ajax({
			url: sGetCustomersDivisionServlet,
			type: "POST",
			async: false,
			contentType: "applikation/x-www-form-urlencoded; charset=UTF-8",
			cache: false,
			xhrFields: {
				withCredentials: true
			},
			error: function (jqXHR, textStatus, errorThrown) {
				jQuery.sap.log.error("Call check construction website membership raise an error " + errorThrown);
			},
			success: function (json) {
				jQuery.sap.log.info("Call heck construction website membership was successfully");
				jQuery.sap.storage.put("division", json.division);
				jQuery.sap.storage.put("technicianShopMember", json.technicianShopMember);
				jQuery.sap.storage.put("agrarianShopMember", json.agrarianShopMember);
				jQuery.sap.storage.put("agrarianConstructionShopMember", json.agrarianConstructionShopMember);
			}
		});
	};

	var renderFunction = function () {
		jQuery.sap.setIcons({
			'phone': '',
			'phone@2': '',
			'tablet': '',
			'tablet@2': '',
			'favicon': '/favicon.ico',
			'precomposed': true
		});
	};

	sap.ui.getCore().getEventBus().subscribe("launchpad", "contentRendered", renderFunction);

	sap.ushell.Container.attachLogoutEvent(function (oEvent) {

		var bAgrarianShop = jQuery.sap.storage.get("agrarianShopMember");
		var bTechnicianShop = jQuery.sap.storage.get("technicianShopMember");
		var bAgrarianConstructionShop = jQuery.sap.storage.get("agrarianConstructionShopMember");
		var sDivision = jQuery.sap.storage.get("division");

		var listTechnicianURL = "";
		var listConstructionURL = "";
		var listAgrarianURL = "";

		if (sDivision !== "empty") {

			var urlList = "";
			var aList = [];
			if (document.location.host === "serviceportal.raiwa.net") {
				listTechnicianURL = "https://parts.raiwa.net/Logoff";
				listConstructionURL = "https://shop.raiwa.net/logout";
				listAgrarianURL = "https://agrarshop.raiwa.net/logout";
			} else if (document.location.host === "serviceportal.raiwa.net:10446") {
				listTechnicianURL = "https://parts.raiwa.net/Logoff";
				listConstructionURL = "https://testshop.raiwa.net/logout";
				listAgrarianURL = "https://testagrarshop.raiwa.net/logout";
			} else if (document.location.host === "serviceportal.raiwa.net:10445") {
				listTechnicianURL = "https://parts.raiwa.net/Logoff";
				listConstructionURL = "https://testshop.raiwa.net/logout";
				listAgrarianURL = "https://testagrarshop.raiwa.net/logout";
			} else { // fallback to productive systems 
				listTechnicianURL = "https://parts.raiwa.net/Logoff";
				listConstructionURL = "https://shop.raiwa.net/logout";
				listAgrarianURL = "https://agrarshop.raiwa.net/logout";
			}

			if (sDivision === "Agrar" || sDivision === "Agrartechnik") {
				if (bTechnicianShop) {
					urlList = listTechnicianURL;
					callLogOffUrl(urlList);
				}
				if (bAgrarianShop) {
					urlList = listAgrarianURL;
					callLogOffUrl(urlList);
				}
				if (bAgrarianConstructionShop) {
					urlList = listConstructionURL;
					callLogOffUrl(urlList);
				}
			} else if (sDivision === "Baustoffe") {
				urlList = listConstructionURL;
				callLogOffUrl(urlList);
			}

			function callLogOffUrl(sURL) {
				if (urlList !== "") {
					$.ajax({
						url: sURL,
						xhrFields: {
							withCredentials: true
						},
						error: function (jqXHR, textStatus, errorThrown) {
							jQuery.sap.log.error("Call log-off url raise an error " + errorThrown + " " + sURL);
						},
						success: function () {
							jQuery.sap.log.debug("Call log-off url was successfully " + sURL);
						}
					});
				}
			}
		}
		// delete the session storage custom properties 
		jQuery.sap.storage.clear();
	});

	// to remove the tile tool-tip and and set the shell header delay to zero
	jQuery.sap.delayedCall(2000, this, function () {
		// to hide the FFP Header for mobile device
		try {
			sap.ui.getCore().byId("shell").setHeaderHidingDelay(0);
		} catch (error) { /* */ }
		var renderer = sap.ushell.Container.getRenderer("fiori2");
		renderer.setFooter(oFooterBar);
		checkMembership();
	});

	var origOpen = XMLHttpRequest.prototype.open;
	XMLHttpRequest.prototype.open = function () {
		this.addEventListener("load", function (event) {
			if (this.status === 401) {
				//sap.ushell.Container.logout();
				jQuery.sap.log.error("all sessions not valid");
			}
		});
		origOpen.apply(this, arguments);
	};

	// window hash changed event set the FAVICON and remove the shell footer for external shops
	window.addEventListener("hashchange", function (oEvent) {

		var oRenderer = sap.ushell.Container.getRenderer("fiori2");
		var sHash = document.location.hash;

		if (sHash === "#RaiwaShop-display") {
			oRenderer.removeFooter();
			bShop = true;
		} else if (sHash === "#AgrarShop-display") {
			oRenderer.removeFooter();
			bShop = true;
		} else {
			if (bShop) {
				oRenderer.setFooter(oFooterBar);
				bShop = false;
			}
		}

		if ((!sap.ui.Device.browser.edge) || (!sap.ui.Device.browser.msie)) {
			jQuery.sap.delayedCall(250, this, function () {
				jQuery('link[rel="shortcut icon"]').attr("href", "/favicon.ico");
			});
		}

	}, false);

}());
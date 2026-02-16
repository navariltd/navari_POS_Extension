# POS Customization - Salesperson PIN Authentication

Track individual salesperson sales in ERPNext POS using PIN authentication.

## What It Does

When multiple salespersons use the same POS profile, this app lets each person identify themselves with a 4-digit PIN. The system remembers who used each device and automatically tracks their sales.

## Installation

```bash
cd frappe-bench
bench get-app https://github.com/navariltd/navari_POS_Extension.git
bench --site your-site.com install-app navari_pos_extension
bench migrate
bench restart
```

The app automatically creates all required fields during installation.

## Setup

### Set PINs for Your Salespersons

1. Go to **Sales Person** list
2. Open each salesperson
3. Enter a unique 4-digit PIN from the **Action** drop-down
4. Save

That's it. The app is ready to use.

## How to Use

### First Time on a Device

1. Open **Point of Sale**
2. Add items and proceed to checkout
3. Enter your 4-digit PIN
4. Click **Verify**
5. Complete the sale

### Next Time on Same Device

The POS remembers you automatically. Just start selling.

To switch salesperson, click **Change** and enter a different PIN.

### If You Don't Want the Device to Remember You

Uncheck **Remember Salesperson on this device** before entering your PIN.

## What Happens Behind the Scenes

- Your PIN identifies you as the salesperson
- You're automatically added to the sales invoice - sales team
- Each device remembers its last user
- Memory expires after 30 days of inactivity

## Important Note

Each POS Profile can only have one active POS Opening Entry at a time. If you have multiple devices in your shop, create a separate POS Profile for each device.

Example:

- Device 1: POS Profile "Counter 1"
- Device 2: POS Profile "Counter 2"
- Device 3: POS Profile "Counter 3"

Multiple salespersons can share the same POS Profile on the same device by switching between PINs.

## Common Questions

**Do I need a different POS Profile for each salesperson?**  
No. Multiple salespersons can share one POS Profile.

**Can two people have the same PIN?**  
No. The system ensures each PIN is unique.

**What if I use multiple devices?**  
Each device remembers separately. Enter your PIN once per device.

**Does this work offline?**  
PIN verification requires server connection. Once verified, the device remembers you.

## Troubleshooting

**My PIN doesn't work**

- Make sure it's exactly 4 digits
- Check that your Sales Person record is enabled
- Verify the PIN was saved correctly

**Device doesn't remember me**

- Check that **Remember Salesperson** is checked
- Clear browser cache and try again

## Requirements

- frappe = ">=16.0.0,<17.0.0"
- erpnext = ">=16.0.0,<17.0.0"

## Support

For issues: https://github.com/navariltd/navari_POS_Extension/issues

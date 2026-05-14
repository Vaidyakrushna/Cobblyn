"""Role-based access control roles and permissions."""

ROLE_USER = "user"
ROLE_STAFF = "staff"
ROLE_ADMIN = "admin"
ROLE_SUPER_ADMIN = "super_admin"

# Permission groups
PERMISSIONS = {
    ROLE_USER: set(),
    # Staff: can manage operational data (orders, inventory, returns) but not products/coupons/banners/users
    ROLE_STAFF: {
        "view_dashboard", "manage_orders", "manage_inventory",
        "manage_production", "manage_returns", "manage_visits",
        "view_customers", "view_tickets",
    },
    # Admin: everything except managing other admins/super-admins
    ROLE_ADMIN: {
        "view_dashboard", "manage_orders", "manage_inventory",
        "manage_production", "manage_returns", "manage_visits",
        "view_customers", "block_customers", "view_tickets", "respond_tickets",
        "manage_products", "manage_materials", "manage_rules",
        "manage_banners", "manage_coupons", "view_analytics",
        "upload_assets", "bulk_upload",
    },
    ROLE_SUPER_ADMIN: {
        "view_dashboard", "manage_orders", "manage_inventory",
        "manage_production", "manage_returns", "manage_visits",
        "view_customers", "block_customers", "view_tickets", "respond_tickets",
        "manage_products", "manage_materials", "manage_rules",
        "manage_banners", "manage_coupons", "view_analytics",
        "upload_assets", "bulk_upload",
        "manage_users", "manage_roles",
    },
}

ADMIN_ROLES = {ROLE_ADMIN, ROLE_SUPER_ADMIN, ROLE_STAFF}


def has_permission(role: str, perm: str) -> bool:
    return perm in PERMISSIONS.get(role, set())


def is_admin_role(role: str) -> bool:
    return role in ADMIN_ROLES

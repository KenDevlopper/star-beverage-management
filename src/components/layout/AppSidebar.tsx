
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { BarChart3, Boxes, Home, Package, ShoppingCart, Users, Settings, Shield } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";
import { usePermissions } from "@/hooks/usePermissions";
import RotatingLogo from "@/components/ui/RotatingLogo";

const AppSidebar = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const { translate } = useTranslation();
  const { 
    canAccessDashboard,
    canAccessInventory,
    canAccessProducts,
    canAccessOrders,
    canAccessCustomers,
    canAccessReports,
    canAccessSettings,
    canAccessAdmin,
    roleInfo
  } = usePermissions();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    { 
      title: t('navigation.dashboard'), 
      path: "/", 
      icon: Home, 
      canAccess: canAccessDashboard 
    },
    { 
      title: t('navigation.orders'), 
      path: "/orders", 
      icon: ShoppingCart, 
      canAccess: canAccessOrders 
    },
    { 
      title: t('navigation.inventory'), 
      path: "/inventory", 
      icon: Package, 
      canAccess: canAccessInventory 
    },
    { 
      title: t('navigation.products'), 
      path: "/products", 
      icon: Boxes, 
      canAccess: canAccessProducts 
    },
    { 
      title: t('navigation.customers'), 
      path: "/customers", 
      icon: Users, 
      canAccess: canAccessCustomers 
    },
    { 
      title: t('navigation.reports'), 
      path: "/reports", 
      icon: BarChart3, 
      canAccess: canAccessReports 
    },
  ];

  const systemItems = [
    { 
      title: t('navigation.settings'), 
      path: "/settings", 
      icon: Settings, 
      canAccess: canAccessSettings 
    },
    { 
      title: t('navigation.administration'), 
      path: "/admin", 
      icon: Shield, 
      canAccess: canAccessAdmin 
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex flex-col items-center gap-2 px-4 py-3">
          <div className="text-white font-bold text-xl">StarBeverage</div>
          <RotatingLogo size="lg" speed="very-slow" className="opacity-80 w-24 h-24" />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.main')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems
                .filter(item => item.canAccess)
                .map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive(item.path)}
                    >
                      <Link to={item.path}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.system')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems
                .filter(item => item.canAccess)
                .map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive(item.path)}
                    >
                      <Link to={item.path}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="px-4 py-3 space-y-2">
          {roleInfo && (
            <div className="text-xs text-sidebar-foreground/70">
              <div className="font-medium text-sidebar-foreground">
                {roleInfo.displayName}
              </div>
              <div className="text-xs text-sidebar-foreground/60">
                {roleInfo.description}
              </div>
            </div>
          )}
          <div className="text-xs text-sidebar-foreground/70">
            StarBeverage Management © 2025
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;

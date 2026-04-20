export type Distro = string;

export interface ProfileCatalogItem {
  name: string;
  compatible_distros: string[];
  source_file: string;
}

export interface RoleInfo {
  name: string;
  display_name: string;
  description: string;
  compatible_distros: string[];
  requires_roles: string[];
}
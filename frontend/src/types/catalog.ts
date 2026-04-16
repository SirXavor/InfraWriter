export type Distro = string;

export interface ProfileCatalogItem {
  name: string;
  compatible_distros: string[];
  source_file: string;
}

export type RoleName = string;
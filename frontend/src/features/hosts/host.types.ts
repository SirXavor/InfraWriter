export type HostKind = "host";

export interface HostIdentity {
  mac?: string[];
}

export interface HostProvisioning {
  distro: string;
  version: string;
  server?: string;
  luks_passphrase?: string;
  tang_url?: string;
  ubuntu_iso?: string;
  [key: string]: unknown;
}

export interface HostAutomationRepo {
  url: string;
  local_path: string;
  branch: string;
}

export interface HostAutomationApply {
  playbook: string;
  interval: string;
}

export interface HostUser {
  name: string;
  password?: string;
  groups?: string[];
  shell?: string;
  ssh_keys?: string[];
}

export interface HostAutomationVars {
  test_message?: string;
  users?: HostUser[];
  network?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface HostAutomation {
  repo: HostAutomationRepo;
  apply: HostAutomationApply;
  roles: string[];
  vars: HostAutomationVars;
}

export interface Host {
  kind: HostKind;
  name: string;
  identity?: HostIdentity;
  profile: string;
  hostname: string;
  provisioning: HostProvisioning;
  automation: HostAutomation;
}
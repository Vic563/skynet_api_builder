import type { Workflow } from '../types';

export const workflows: Workflow[] = [
  {
    id: 'deploy-new-arista-switch-existing-site',
    name: 'Deploy new Arista switch to existing site',
    description:
      'Register an adhoc Arista leaf at an existing site, soft-lock it, onboard it with management MAC, then sync configuration.',
    steps: [
      {
        id: 'register-adhoc-switch',
        label: 'Register adhoc Arista switch',
        description:
          'Register the new Arista switch in the site topology (topology name matches the site code).',
        method: 'POST',
        path: '/api/v4/sdn/arista/switch/adhoc_register',
      },
      {
        id: 'soft-lockout-switch',
        label: 'Soft-lockout Arista switch',
        description:
          'Place the switch into soft_lockout so Skynet stages changes for manual CVP push while onboarding is validated.',
        method: 'POST',
        path: '/api/v4/sdn/arista/switch/lockout',
      },
      {
        id: 'onboard-adhoc-switch',
        label: 'Onboard adhoc Arista switch',
        description:
          'Onboard the registered adhoc Arista switch using its management MAC so it can be configured for the existing site.',
        method: 'POST',
        path: '/api/v4/sdn/arista/switch/adhoc_onboard',
      },
      {
        id: 'sync-switch-config',
        label: 'Sync Arista switch configuration',
        description:
          'Generate and push config for the new Arista switch at the existing site.',
        method: 'POST',
        path: '/api/v4/sdn/arista/switch/sync_config',
      },
    ],
  },
  {
    id: 'vm-ip-lifecycle',
    name: 'VM IP lifecycle (assign & delete)',
    description:
      'Allocate a new VM IP for a tenant/site and later delete it when the VM is decommissioned.',
    steps: [
      {
        id: 'assign-ip',
        label: 'Assign IP',
        description: 'Allocate the next available VM IP in the requested site or tenant VPC.',
        method: 'POST',
        path: '/api/v4/cloud/assign_ip',
      },
      {
        id: 'delete-ip',
        label: 'Delete IP',
        description: 'Delete a previously assigned VM IP when the VM is removed.',
        method: 'POST',
        path: '/api/v4/cloud/delete_ip',
      },
    ],
  },
  {
    id: 'security-zone-lifecycle',
    name: 'Security zone create/endpoints/delete',
    description:
      'Create a security zone, add endpoints, inspect it, then remove endpoints and delete the zone.',
    steps: [
      {
        id: 'create-security-zone',
        label: 'Create security zone',
        description: 'Create a new security zone for a tenant.',
        method: 'POST',
        path: '/api/v4/cloud/zones/ZONE_NAME?tenant=TENANT_NAME',
      },
      {
        id: 'create-security-zone-endpoints',
        label: 'Create security zone endpoints',
        description: 'Add endpoints (VMs, IPs, or NSX segments) to the security zone.',
        method: 'POST',
        path: '/api/v4/cloud/zones/ZONE_NAME/endpoints?tenant=TENANT_NAME',
      },
      {
        id: 'get-security-zone',
        label: 'Get security zone',
        description: 'Retrieve details for the security zone.',
        method: 'GET',
        path: '/api/v4/cloud/zones/ZONE_NAME?tenant=TENANT_NAME',
      },
      {
        id: 'get-security-zone-endpoints',
        label: 'Get security zone endpoints',
        description: 'List endpoints currently attached to the security zone.',
        method: 'GET',
        path: '/api/v4/cloud/zones/ZONE_NAME/endpoints?tenant=TENANT_NAME',
      },
      {
        id: 'delete-security-zone-endpoints',
        label: 'Delete security zone endpoints',
        description: 'Remove endpoints from the security zone.',
        method: 'DELETE',
        path: '/api/v4/cloud/zones/ZONE_NAME/endpoints?tenant=TENANT_NAME',
      },
      {
        id: 'delete-security-zone',
        label: 'Delete security zone',
        description: 'Delete the security zone when it is no longer needed.',
        method: 'DELETE',
        path: '/api/v4/cloud/zones/ZONE_NAME?tenant=TENANT_NAME',
      },
    ],
  },
  {
    id: 'load-balancer-vip-lifecycle',
    name: 'Load balancer VIP lifecycle',
    description:
      'Create a new load balancer VIP, optionally update it, inspect status/config, and delete it when no longer needed.',
    steps: [
      {
        id: 'get-lb-vip-status',
        label: 'GET VIP status/config',
        description:
          'Retrieve status and configuration for an existing VIP before making changes.',
        method: 'GET',
        path: '/api/v4/cloud/loadbalancer_mgmt?fqdn=rundeck.ssnc-corp.cloud&port=443&type=enterprise&protocol=http&site=wcd',
      },
      {
        id: 'post-lb-functions',
        label: 'Create or delete VIP',
        description:
          'Use the POST Load Balancer Functions API to create a new VIP or delete an existing one.',
        method: 'POST',
        path: '/api/v4/cloud/loadbalancer_mgmt',
      },
      {
        id: 'put-lb-request',
        label: 'Update VIP',
        description: 'Update properties of an existing VIP.',
        method: 'PUT',
        path: '/api/v4/cloud/loadbalancer_mgmt',
      },
      {
        id: 'delete-lb-vip',
        label: 'DELETE VIP',
        description: 'Delete an existing VIP from the load balancer.',
        method: 'DELETE',
        path: '/api/v4/cloud/loadbalancer_mgmt?fqdn=lab-sg-test5.ssnc-corp.cloud&port=888&site=ykt&type=enterprise&site=wcd',
      },
    ],
  },
  {
    id: 'vip-migration',
    name: 'VIP migration',
    description:
      'Pre-check and execute a load balancer VIP migration using the Migrate VIP APIs.',
    steps: [
      {
        id: 'get-migrate-vip',
        label: 'GET Migrate VIP',
        description: 'Retrieve current migration status or options for a VIP.',
        method: 'GET',
        path: '/api/v4/cloud/migrate_vip?vip_name=<vip_name>&f5=<f5>&lbpair',
      },
      {
        id: 'post-migrate-vip',
        label: 'POST Migrate VIP',
        description: 'Kick off a VIP migration.',
        method: 'POST',
        path: '/api/v4/cloud/migrate_vip',
      },
    ],
  },
  {
    id: 'gslb-wip-lifecycle',
    name: 'GSLB WIP lifecycle',
    description:
      'Create, update, and delete a GSLB WIP entry, and inspect its status.',
    steps: [
      {
        id: 'get-gslb-wip-status',
        label: 'Get GSLB WIP status',
        description: 'Check the current status of a GSLB WIP.',
        method: 'GET',
        path: '/api/v4/cloud/gslb?wip=apim-pg.ssnc-corp.cloud',
      },
      {
        id: 'create-gslb-wip',
        label: 'Create GSLB WIP',
        description: 'Create a new GSLB WIP entry.',
        method: 'POST',
        path: '/api/v4/cloud/gslb',
      },
      {
        id: 'update-gslb-wip',
        label: 'Update GSLB WIP',
        description: 'Update an existing GSLB WIP entry.',
        method: 'PUT',
        path: '/api/v4/cloud/gslb',
      },
      {
        id: 'delete-gslb-wip',
        label: 'Delete GSLB WIP',
        description: 'Delete a GSLB WIP entry.',
        method: 'DELETE',
        path: '/api/v4/cloud/gslb?wip=test.ssnc-corp.cloud',
      },
    ],
  },
  {
    id: 'greenfield-sdn2-site-build',
    name: 'Greenfield SDN2 site build',
    description:
      'Design a new SDN2 cable map topology, register it as a site, then onboard initial Arista switches.',
    steps: [
      {
        id: 'get-cable-profile',
        label: 'Get cable map profiles',
        description: 'Inspect existing SDN cable map topology profiles before building a new topology.',
        method: 'GET',
        path: '/api/v4/sdn/arista/cable_profile?profile_id=<value>&profile_name=<value>',
      },
      {
        id: 'post-cable-profile',
        label: 'Create or update cable map profile',
        description: 'Create or update a cable map topology profile and model defaults.',
        method: 'POST',
        path: '/api/v4/sdn/arista/cable_profile',
      },
      {
        id: 'build-cable-topology',
        label: 'Build cable map topology',
        description:
          'Request a new SDN cable map topology build for the site, using the selected profile.',
        method: 'POST',
        path: '/api/v4/sdn/arista/cable_topology',
      },
      {
        id: 'register-cable-topology',
        label: 'Register cable map topology',
        description:
          'Register the built cable topology into production as an SDN2 site (Register Arista Cable Topology).',
        method: 'POST',
        path: '/api/v4/sdn/arista/cable_topology_registration',
      },
      {
        id: 'onboard-arista-switch',
        label: 'Onboard Arista switches from topology',
        description:
          'Onboard topology-registered Arista switches so their configs are built and ready for deployment.',
        method: 'POST',
        path: '/api/v4/sdn/arista/switch/onboard',
      },
    ],
  },
  {
    id: 'site-common-config-lifecycle',
    name: 'Site common config (DNS/TACACS/ASN) lifecycle',
    description:
      'Add, view, update, and delete site common config entries such as DNS servers, enterprise_domain, and inet_asn.',
    steps: [
      {
        id: 'add-site-common-config',
        label: 'Add site common config',
        description:
          'Create a site common config entry with topology_services like dns_servers, enterprise_domain, and inet_asn.',
        method: 'POST',
        path: '/api/v4/sdn/site_common_config',
      },
      {
        id: 'get-site-common-config',
        label: 'Get site common config',
        description: 'Retrieve common config for a site by site_name.',
        method: 'GET',
        path: '/api/v4/sdn/site_common_config?site_name=value',
      },
      {
        id: 'update-site-common-config',
        label: 'Update site common config',
        description:
          'Update topology_services for a site, for example changing dns_servers or enterprise_domain.',
        method: 'PUT',
        path: '/api/v4/sdn/site_common_config',
      },
      {
        id: 'delete-site-common-config',
        label: 'Delete site common config items',
        description:
          'Delete specific common config items (such as dns_servers, enterprise_domain, inet_asn) for a site.',
        method: 'DELETE',
        path: '/api/v4/sdn/site_common_config',
      },
    ],
  },
  {
    id: 'vrf-lifecycle',
    name: 'VRF create and update (SDN2)',
    description:
      'Create a new SDN2 VRF and later update it, using the VRF Create and VRF Update APIs.',
    steps: [
      {
        id: 'vrf-create',
        label: 'Create VRF',
        description: 'Create a new VRF with SDN2 profile and default properties.',
        method: 'POST',
        path: '/api/v4/sdn/vrf',
      },
      {
        id: 'vrf-update',
        label: 'Update VRF',
        description: 'Update an existing VRF, including SDN2 profile fields.',
        method: 'PUT',
        path: '/api/v4/sdn/vrf',
      },
    ],
  },
  {
    id: 'arista-day2-management',
    name: 'Arista day-2 management (lockout, roles, sync)',
    description:
      'Lockout an Arista switch, deploy switch roles, and run a sync for day-2 configuration changes.',
    steps: [
      {
        id: 'lockout-arista',
        label: 'Lockout Arista switch',
        description: 'Set an Arista switch into soft or hard lockout before applying changes.',
        method: 'POST',
        path: '/api/v4/sdn/arista/switch/lockout',
      },
      {
        id: 'deploy-arista-roles',
        label: 'Deploy Arista switch roles',
        description: 'Deploy Arista switch roles across a device or site.',
        method: 'PUT',
        path: '/api/v4/sdn/arista/switch/roles',
      },
      {
        id: 'sync-arista-switches',
        label: 'Sync Arista switch configuration',
        description: 'Sync configuration changes to Arista switches.',
        method: 'POST',
        path: '/api/v4/sdn/arista/switch/sync_config',
      },
    ],
  },
  {
    id: 'openshift-server-onboarding',
    name: 'OpenShift server onboarding lifecycle',
    description:
      'Onboard an OpenShift server, update its onboarding parameters, and delete it when decommissioned.',
    steps: [
      {
        id: 'onboard-openshift-server',
        label: 'Onboard OpenShift server',
        description: 'Onboard an OpenShift server so connected Arista ports are configured.',
        method: 'POST',
        path: '/api/v4/sdn/arista/openshift/onboard',
      },
      {
        id: 'update-openshift-server',
        label: 'Update onboarded OpenShift server',
        description: 'Update onboarding parameters for an existing OpenShift server.',
        method: 'PUT',
        path: '/api/v4/sdn/arista/openshift/onboard',
      },
      {
        id: 'delete-openshift-server',
        label: 'Delete onboarded OpenShift server',
        description: 'Delete an onboarded OpenShift server entry.',
        method: 'DELETE',
        path: '/api/v4/sdn/arista/openshift/onboard',
      },
    ],
  },
  {
    id: 'esxi-server-onboarding',
    name: 'ESXi server onboarding lifecycle',
    description:
      'Onboard an ESXi server, update its onboarding parameters, and delete it when decommissioned.',
    steps: [
      {
        id: 'onboard-esxi-server',
        label: 'Onboard ESXi server',
        description: 'Onboard an ESXi server so connected Arista ports are configured.',
        method: 'POST',
        path: '/api/v4/sdn/arista/esxi/onboard',
      },
      {
        id: 'update-esxi-server',
        label: 'Update onboarded ESXi server',
        description: 'Update onboarding parameters for an existing ESXi server.',
        method: 'PUT',
        path: '/api/v4/sdn/arista/esxi/onboard',
      },
      {
        id: 'delete-esxi-server',
        label: 'Delete onboarded ESXi server',
        description: 'Delete an onboarded ESXi server entry.',
        method: 'DELETE',
        path: '/api/v4/sdn/arista/esxi/onboard',
      },
    ],
  },
  {
    id: 'physical-server-onboarding',
    name: 'Physical server onboarding',
    description:
      'Onboard a physical server so its attached Arista ports are configured.',
    steps: [
      {
        id: 'onboard-physical-server',
        label: 'Onboard physical server',
        description: 'Onboard a physical server into the SDN2 site.',
        method: 'POST',
        path: '/api/v4/sdn/arista/phy/onboard',
      },
    ],
  },
  {
    id: 'pure-storage-onboarding',
    name: 'Pure Storage onboarding lifecycle',
    description:
      'Onboard a Pure Storage device, update it, and check onboarding task status.',
    steps: [
      {
        id: 'get-pure-onboard-task-status',
        label: 'Get Pure onboard task status',
        description: 'Check status of a Pure Storage onboarding task.',
        method: 'GET',
        path: '/api/v4/sdn/arista/pure/onboard?child_task_id=<task_id_number>',
      },
      {
        id: 'onboard-pure-device',
        label: 'Onboard Pure Storage device',
        description: 'Onboard a Pure Storage device into the SDN2 fabric.',
        method: 'POST',
        path: '/api/v4/sdn/arista/pure/onboard',
      },
      {
        id: 'update-pure-device',
        label: 'Update Pure Storage device',
        description: 'Update onboarding details for an existing Pure Storage device.',
        method: 'PUT',
        path: '/api/v4/sdn/arista/pure/onboard',
      },
    ],
  },
  {
    id: 'stage-sdn2-site-for-pure-storage',
    name: 'Stage existing SDN2 site for Pure Storage',
    description:
      'Prepare an existing SDN2 site for Pure Storage by updating device profile components and SDN device service cabinets.',
    steps: [
      {
        id: 'get-device-profile-components',
        label: 'Get device profile components',
        description: 'Retrieve existing device profile components for the site or global scope.',
        method: 'GET',
        path: '/api/v4/sdn/arista/device_profile_component?profile_scope=<global|site>',
      },
      {
        id: 'add-device-profile-component',
        label: 'Add device profile component',
        description:
          'Add a new device profile component for Pure Storage uplinks or related layers using the Add Device Profile Component API.',
        method: 'POST',
        path: '/api/v4/sdn/arista/device_profile_component',
      },
      {
        id: 'update-device-profile-component',
        label: 'Update device profile component',
        description:
          'Update an existing device profile component for Pure Storage uplinks, such as ranges or mapping.',
        method: 'PUT',
        path: '/api/v4/sdn/arista/device_profile_component',
      },
      {
        id: 'get-sdn-device-info',
        label: 'Get SDN device information',
        description: 'Retrieve SDN device information and properties, including service locations.',
        method: 'GET',
        path: '/api/v4/sdn/sdn_device_info?site=<site>&include_properties=<true|false>&hostname=<hostname>&device_id=<device_id>',
      },
      {
        id: 'update-sdn-device-info',
        label: 'Update SDN device information',
        description:
          'Update SDN device information such as service_locations and management/console cabinets for Pure Storage cross-cabinet cabling.',
        method: 'PUT',
        path: '/api/v4/sdn/sdn_device_info',
      },
    ],
  },
  {
    id: 'device-offboarding-unregistration',
    name: 'Device offboarding and unregistration',
    description:
      'Offboard Arista switches from a site and unregister adhoc devices (Arista, ESXi, or physical) from SDN2.',
    steps: [
      {
        id: 'offboard-arista-switch',
        label: 'Offboard Arista switch',
        description:
          'Offboard an Arista switch and optionally unregister it in a single call using the Offboard Arista Switch API.',
        method: 'DELETE',
        path: '/api/v4/sdn/arista/switch/onboard?hostname=<switch_name>&unregister=<true|false>',
      },
      {
        id: 'unregister-adhoc-device',
        label: 'Unregister adhoc device',
        description:
          'Unregister an adhoc device (Arista, ESXi, or Physical) from SDN2 using the Unregister Adhoc Arista Device API.',
        method: 'DELETE',
        path: '/api/v4/sdn/arista/device/adhoc_unregister?hostname=<hostname>&device_type=<arista_device|esxi_device|phy_device>',
      },
    ],
  },
  {
    id: 'dns-host-record-lifecycle',
    name: 'DNS host record lifecycle',
    description:
      'Inspect DNS zones, create DNS host records, and delete them when no longer needed.',
    steps: [
      {
        id: 'get-dns-zones',
        label: 'Get DNS zones',
        description: 'List DNS zones for a tenant.',
        method: 'GET',
        path: '/api/v4/cloud/dns_zone/<tenant>',
      },
      {
        id: 'get-dns-host-record',
        label: 'Get DNS host record',
        description: 'Look up an existing DNS host record.',
        method: 'GET',
        path: '/api/v4/network/dns_host_record?&tenant=<tenant>&hostname=<hostname>&zone=<zone>&view=<view>',
      },
      {
        id: 'add-dns-host-record',
        label: 'Add DNS host record',
        description: 'Create a new DNS host record.',
        method: 'POST',
        path: '/api/v4/network/dns_host_record',
      },
      {
        id: 'delete-dns-host-record',
        label: 'Delete DNS host record',
        description: 'Delete an existing DNS host record.',
        method: 'DELETE',
        path: '/api/v4/network/dns_host_record?&tenant=ssnc&hostname=test1&zone=sscautobots.com&view=Enterprise&delete_ip=false',
      },
    ],
  },
  {
    id: 'dns-alias-management',
    name: 'DNS alias management',
    description:
      'Look up and manage DNS aliases using the alias DNS request APIs.',
    steps: [
      {
        id: 'alias-dns-request-get',
        label: 'Alias DNS Request - GET',
        description: 'Look up DNS alias details for an FQDN.',
        method: 'GET',
        path: '/api/v4/cloud/alias_dns_request?tenant=plain&lookup=zach.ssnc-corp.cloud&view=Enterprise',
      },
      {
        id: 'alias-dns-request-post',
        label: 'Alias DNS Request - POST',
        description: 'Create or update DNS aliases for a host record.',
        method: 'POST',
        path: '/api/v4/cloud/alias_dns_request',
      },
    ],
  },
  {
    id: 'firewall-zone-hygiene',
    name: 'Firewall / zone hygiene',
    description:
      'Reprocess access for a zone, reprocess specific rules, clean rules, and flip ASA sub-zone status.',
    steps: [
      {
        id: 'reprocess-access-by-zone',
        label: 'Reprocess access by zone',
        description: 'Reprocess access for an entire zone, optionally by access ID.',
        method: 'POST',
        path: '/api/v4/cloud/reprocess_access_mgmt',
      },
      {
        id: 'reprocess-access-by-rules',
        label: 'Reprocess access by rules',
        description: 'Reprocess access rules for a firewall and zone.',
        method: 'POST',
        path: '/api/v4/cloud/reprocess_access_mgmt',
      },
      {
        id: 'clean-rule',
        label: 'Clean rule and run sub-zone clean',
        description: 'Reprocess a specific rule and optionally run sub-zone clean.',
        method: 'POST',
        path: '/api/v4/cloud/reprocess_access_mgmt',
      },
      {
        id: 'update-sub-zone-status',
        label: 'Set ASA firewall to use new sub-zone config',
        description: 'Flip an ASA firewall to use the new sub-zone configuration.',
        method: 'POST',
        path: '/api/v4/cloud/reprocess_access_mgmt',
      },
    ],
  },
  {
    id: 'vlan-subnet-sdn-vlan-lifecycle',
    name: 'VLAN definition, subnet, and SDN VLAN lifecycle',
    description:
      'Create and manage VLAN definitions, subnets, and SDN VLANs for SDN sites.',
    steps: [
      {
        id: 'get-vlan-definition',
        label: 'Get VLAN definition',
        description: 'Retrieve an existing VLAN definition by object_id.',
        method: 'GET',
        path: '/api/v4/sdn/vlan_definition?object_id=<object_id>',
      },
      {
        id: 'create-vlan-definition',
        label: 'Create VLAN definition',
        description: 'Create a new VLAN definition, including dynamic allocation and properties.',
        method: 'POST',
        path: '/api/v4/sdn/vlan_definition',
      },
      {
        id: 'update-vlan-definition',
        label: 'Update VLAN definition',
        description: 'Update an existing VLAN definition using the VLAN Definition Update API.',
        method: 'PUT',
        path: '/api/v4/sdn/vlan_definition',
      },
      {
        id: 'delete-vlan-definition',
        label: 'Delete VLAN definition',
        description: 'Delete a VLAN definition by object_id.',
        method: 'DELETE',
        path: '/api/v4/sdn/vlan_definition?object_id=<object_id>',
      },
      {
        id: 'get-subnet',
        label: 'Get subnet',
        description: 'Retrieve details for an existing subnet by subnet_id.',
        method: 'GET',
        path: '/api/v4/sdn/subnet?subnet_id=<subnet_id>',
      },
      {
        id: 'create-subnet',
        label: 'Create subnet',
        description: 'Create a subnet associated to a VRF, tenant, VLAN, and optional VLAN definition.',
        method: 'POST',
        path: '/api/v4/sdn/subnet',
      },
      {
        id: 'update-subnet',
        label: 'Update subnet',
        description: 'Update subnet attributes such as VRF, env, host_type, VLAN, and linked pods.',
        method: 'PUT',
        path: '/api/v4/sdn/subnet',
      },
      {
        id: 'delete-subnet',
        label: 'Delete subnet',
        description: 'Delete a subnet and optionally remove it from IPAM.',
        method: 'DELETE',
        path: '/api/v4/sdn/subnet?subnet_id=<subnet_id>&del_from_ipam=<true|false>',
      },
      {
        id: 'get-sdn-vlan',
        label: 'Get SDN VLAN',
        description: 'Retrieve SDN VLAN information for a VLAN definition or by filters.',
        method: 'GET',
        path: '/api/v4/sdn/vlan?vlan_definition_id=<vlan_definition_id>',
      },
      {
        id: 'create-sdn-vlan',
        label: 'Create SDN VLAN',
        description: 'Create an SDN VLAN associated to a VLAN definition and site.',
        method: 'POST',
        path: '/api/v4/sdn/vlan',
      },
      {
        id: 'update-sdn-vlan',
        label: 'Update SDN VLAN',
        description: 'Update an existing SDN VLAN using the Update SDN VLAN API.',
        method: 'PATCH',
        path: '/api/v4/sdn/vlan',
      },
      {
        id: 'delete-sdn-vlan',
        label: 'Delete SDN VLAN',
        description: 'Delete an SDN VLAN and optionally update IPAM.',
        method: 'DELETE',
        path: '/api/v4/sdn/vlan?vlan_definition_id=<vlan_definition_id>&update_ipam=<true|false>',
      },
    ],
  },
  {
    id: 'migrate-sdn1-vrfs-to-dc',
    name: 'Migrate SDN1 VRFs to DC',
    description:
      'Move subnets from the SDN1 VRF to the SDN2 DC VRF by updating subnet and VLAN definition VRF fields, then syncing Arista switches.',
    steps: [
      {
        id: 'get-subnet-for-migration',
        label: 'Get subnet to migrate',
        description: 'Retrieve the subnet entry that currently points to the SDN1 VRF.',
        method: 'GET',
        path: '/api/v4/sdn/subnet?subnet_id=<subnet_id>',
      },
      {
        id: 'update-subnet-vrf',
        label: 'Update subnet VRF reference',
        description:
          'Update the subnet to point to the SDN2 DC VRF (sdn_version 2) using the Subnet Update API.',
        method: 'PUT',
        path: '/api/v4/sdn/subnet',
      },
      {
        id: 'update-vlan-definition-vrf',
        label: 'Update VLAN definition VRF field',
        description:
          'Update the VLAN definition VRF string field to match the new DC VRF using the VLAN Definition Update API.',
        method: 'PUT',
        path: '/api/v4/sdn/vlan_definition',
      },
      {
        id: 'sync-switch-config-after-migration',
        label: 'Sync Arista switch configuration',
        description:
          'Sync Arista switch configuration so the migrated VRF/subnet changes are applied to devices.',
        method: 'POST',
        path: '/api/v4/sdn/arista/switch/sync_config',
      },
    ],
  },
  {
    id: 'content-library-ova-lifecycle',
    name: 'Content Library OVA lifecycle',
    description:
      'Read OVA details, request an OVA upload, update enabled status, delete an OVA, and sync to subscriber libraries.',
    steps: [
      {
        id: 'read-ova-details',
        label: 'Read OVA details',
        description: 'Retrieve details for an OVA in the content library.',
        method: 'GET',
        path: '/api/v4/sdn/content_library/ova?{parameter_name}={parameter_value}',
      },
      {
        id: 'create-ova-upload',
        label: 'Create and request OVA upload',
        description: 'Create and request upload of an OVA to the content library.',
        method: 'POST',
        path: '/api/v4/sdn/content_library/ova',
      },
      {
        id: 'update-ova-enabled',
        label: 'Update OVA enabled status',
        description: 'Enable or disable an OVA in the content library.',
        method: 'PUT',
        path: '/api/v4/sdn/content_library/ova',
      },
      {
        id: 'delete-ova',
        label: 'Delete OVA',
        description: 'Delete an OVA from the content library.',
        method: 'DELETE',
        path: '/api/v4/sdn/content_library/ova',
      },
      {
        id: 'sync-ovas',
        label: 'Sync OVAs to subscriber libraries',
        description: 'Sync OVAs from the publisher library to subscriber libraries.',
        method: 'POST',
        path: '/api/v4/sdn/content_library/sync',
      },
    ],
  },
  {
    id: 'sdn-object-vcenter-lifecycle',
    name: 'SDN object vCenter lifecycle',
    description:
      'Create, update, and delete SDN object vCenter entries, and retrieve details.',
    steps: [
      {
        id: 'vcenter-get',
        label: 'VCenter Get',
        description: 'Get details for a vCenter object by ID.',
        method: 'GET',
        path: '/api/v4/sdn_object/vcenter/<object_id>',
      },
      {
        id: 'vcenter-create',
        label: 'VCenter Create',
        description: 'Create a new vCenter SDN object.',
        method: 'POST',
        path: '/api/v4/sdn_object/vcenter',
      },
      {
        id: 'vcenter-update',
        label: 'VCenter Update',
        description: 'Update an existing vCenter SDN object.',
        method: 'PUT',
        path: '/api/v4/sdn_object/vcenter/<object_id>',
      },
      {
        id: 'vcenter-delete',
        label: 'VCenter Delete',
        description: 'Delete a vCenter SDN object.',
        method: 'DELETE',
        path: '/api/v4/sdn_object/vcenter/<object_id>',
      },
    ],
  },
  {
    id: 're-cabling-devices',
    name: 'Re-cabling devices',
    description:
      'Move device uplinks, management interfaces, or console interfaces to new ports by updating profiles or device properties, then re-cabling and syncing switches.',
    steps: [
      {
        id: 'get-existing-cabling',
        label: 'Get existing cabling',
        description:
          'Retrieve existing cabling information to plan re-cabling changes.',
        method: 'GET',
        path: '/api/v4/sdn/arista/device/re_cable',
      },
      {
        id: 'get-device-info-for-recable',
        label: 'Get SDN device information',
        description:
          'Get device details (cabinets, pods, profiles) to plan re-cabling strategy.',
        method: 'GET',
        path: '/api/v4/sdn/sdn_device_info?site=<site>&include_properties=<true|false>&hostname=<hostname>&device_id=<device_id>',
      },
      {
        id: 'update-device-profile-component-for-recable',
        label: 'Update device profile component (if needed)',
        description:
          'Update device profile components to drive interface assignment changes for re-cabling.',
        method: 'PUT',
        path: '/api/v4/sdn/arista/device_profile_component',
      },
      {
        id: 'post-recable-devices',
        label: 'Re-cable devices',
        description:
          'Execute re-cabling to move interfaces to new ports based on updated profiles or device properties.',
        method: 'POST',
        path: '/api/v4/sdn/arista/device/re_cable',
      },
      {
        id: 'sync-switches-after-recable',
        label: 'Sync Arista switches after re-cabling',
        description:
          'Sync switches identified in re-cable response to push new interface configurations.',
        method: 'POST',
        path: '/api/v4/sdn/arista/switch/sync_config',
      },
    ],
  },
  {
    id: 'layer2-vlan-migration',
    name: 'Layer 2 VLAN migration',
    description:
      'Migrate old site-level Layer 2 VLANs to the new VLAN Definition format with l2_mode set to L2_ONLY.',
    steps: [
      {
        id: 'get-vlan-definition-for-l2-migration',
        label: 'Get VLAN definition',
        description:
          'Retrieve existing VLAN definition to check if it needs L2_ONLY migration.',
        method: 'GET',
        path: '/api/v4/sdn/vlan_definition?object_id=<object_id>',
      },
      {
        id: 'update-vlan-def-l2-mode',
        label: 'Update VLAN definition l2_mode',
        description:
          'Update VLAN definition to set l2_mode to L2_ONLY for pure Layer 2 VLANs.',
        method: 'PUT',
        path: '/api/v4/sdn/vlan_definition',
      },
      {
        id: 'delete-dummy-subnet-for-l2',
        label: 'Delete dummy subnet (if exists)',
        description:
          'Delete the associated dummy subnet entry if converting from L3 VLAN with disabled SVI.',
        method: 'DELETE',
        path: '/api/v4/sdn/subnet?subnet_id=<subnet_id>&del_from_ipam=<true|false>',
      },
      {
        id: 'create-new-l2-vlan-definition',
        label: 'Create new L2 VLAN definition',
        description:
          'Create a new VLAN definition with l2_mode as L2_ONLY for old L2 SDN objects.',
        method: 'POST',
        path: '/api/v4/sdn/vlan_definition',
      },
    ],
  },
  {
    id: 'management-pod-segmentation-migration',
    name: 'Management pod segmentation migration',
    description:
      'Migrate management fabric from standard pods (pXX) to segmented management pods (mpXX) to enable scaling with super spine layer.',
    steps: [
      {
        id: 'create-new-mgmt-pod',
        label: 'Create new management pod (mpXX)',
        description:
          'Create new management-specific pod(s) for scaling the management fabric.',
        method: 'POST',
        path: '/api/v4/sdn_object/pod',
      },
      {
        id: 'create-loopback2-vlan-def-for-mgmt-pod',
        label: 'Create loopback2 VLAN definition for new pod',
        description:
          'Create loopback2 VLAN definition for each new management pod.',
        method: 'POST',
        path: '/api/v4/sdn/vlan_definition',
      },
      {
        id: 'create-loopback2-subnet-for-mgmt-pod',
        label: 'Create loopback2 subnet for new pod',
        description:
          'Create subnet associated with loopback2 VLAN for the new management pod.',
        method: 'POST',
        path: '/api/v4/sdn/subnet',
      },
      {
        id: 'lockout-mgmt-switches',
        label: 'Set management switches to lockout',
        description:
          'Set management switches to hard or soft lockout before migration changes.',
        method: 'POST',
        path: '/api/v4/sdn/arista/switch/lockout',
      },
      {
        id: 'add-mgmt-ss-profile-components',
        label: 'Add mgmt_super_spine profile components',
        description:
          'Add device profile components for mgmt_super_spine uplinks to mgmt_edge and mgmt_spine.',
        method: 'POST',
        path: '/api/v4/sdn/arista/device_profile_component',
      },
      {
        id: 'update-mgmt-switch-pods',
        label: 'Update management switch pods to mpXX',
        description:
          'Update pod_id and device_pod fields for mgmt_leaf and mgmt_spine switches to new management pods.',
        method: 'PUT',
        path: '/api/v4/sdn/sdn_device_info',
      },
      {
        id: 'uncable-mgmt-uplinks',
        label: 'Un-cable management uplinks',
        description:
          'Un-cable existing uplinks (mgmt_edge to mgmt_spine) using re-cable API with un_cable_only flag.',
        method: 'POST',
        path: '/api/v4/sdn/arista/device/re_cable',
      },
      {
        id: 'add-blocking-profile-for-mgmt-edge',
        label: 'Add blocking profile for mgmt_edge to mgmt_spine',
        description:
          'Create blocking profile (start=0, end=0) to prevent mgmt_edge from uplinking to mgmt_spine.',
        method: 'POST',
        path: '/api/v4/sdn/arista/device_profile_component',
      },
      {
        id: 'register-mgmt-super-spine-switches',
        label: 'Register mgmt_super_spine switches',
        description:
          'Register new management super spine switches to the topology.',
        method: 'POST',
        path: '/api/v4/sdn/arista/switch/adhoc_register',
      },
      {
        id: 'recable-mgmt-uplinks-to-ss',
        label: 'Re-cable management uplinks to super spine',
        description:
          'Re-cable management spine and edge switches to new super spine layer.',
        method: 'POST',
        path: '/api/v4/sdn/arista/device/re_cable',
      },
      {
        id: 'onboard-or-sync-mgmt-switches',
        label: 'Onboard or sync management switches',
        description:
          'Onboard new super spine switches and sync all affected management switches.',
        method: 'POST',
        path: '/api/v4/sdn/arista/switch/onboard',
      },
      {
        id: 'remove-mgmt-lockout',
        label: 'Remove lockout from management switches',
        description:
          'Remove lockout from management switches after physical cabling is complete.',
        method: 'POST',
        path: '/api/v4/sdn/arista/switch/lockout',
      },
    ],
  },
];

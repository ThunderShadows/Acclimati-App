/** Ordered list of all 30 seed cities for the city picker. */
export interface CityOption {
  id:         string;
  name:       string;
  state:      string;
  label:      string; // "Leh, Ladakh"
  altitude_m: number;
}

export const CITIES: CityOption[] = [
  // Himalayan corridor
  { id: 'IXL', name: 'Leh',        state: 'Ladakh',            label: 'Leh, Ladakh',                altitude_m: 3524 },
  { id: 'KUU', name: 'Manali',     state: 'Himachal Pradesh',  label: 'Manali, Himachal Pradesh',    altitude_m: 2050 },
  { id: 'SLV', name: 'Shimla',     state: 'Himachal Pradesh',  label: 'Shimla, Himachal Pradesh',    altitude_m: 2206 },
  { id: 'DED', name: 'Dehradun',   state: 'Uttarakhand',       label: 'Dehradun, Uttarakhand',       altitude_m: 640  },
  { id: 'RSH', name: 'Rishikesh',  state: 'Uttarakhand',       label: 'Rishikesh, Uttarakhand',      altitude_m: 372  },
  { id: 'SXR', name: 'Srinagar',   state: 'J&K',               label: 'Srinagar, J&K',               altitude_m: 1585 },
  { id: 'DAR', name: 'Darjeeling', state: 'West Bengal',       label: 'Darjeeling, West Bengal',     altitude_m: 2042 },
  { id: 'MSR', name: 'Mussoorie',  state: 'Uttarakhand',       label: 'Mussoorie, Uttarakhand',      altitude_m: 2005 },
  // Metros
  { id: 'DEL', name: 'Delhi',      state: 'Delhi',             label: 'Delhi, Delhi',                altitude_m: 216  },
  { id: 'BOM', name: 'Mumbai',     state: 'Maharashtra',       label: 'Mumbai, Maharashtra',         altitude_m: 14   },
  { id: 'BLR', name: 'Bengaluru',  state: 'Karnataka',         label: 'Bengaluru, Karnataka',        altitude_m: 920  },
  { id: 'CCU', name: 'Kolkata',    state: 'West Bengal',       label: 'Kolkata, West Bengal',        altitude_m: 6    },
  { id: 'MAA', name: 'Chennai',    state: 'Tamil Nadu',        label: 'Chennai, Tamil Nadu',         altitude_m: 6    },
  { id: 'HYD', name: 'Hyderabad',  state: 'Telangana',         label: 'Hyderabad, Telangana',        altitude_m: 542  },
  { id: 'PNQ', name: 'Pune',       state: 'Maharashtra',       label: 'Pune, Maharashtra',           altitude_m: 559  },
  { id: 'AMD', name: 'Ahmedabad',  state: 'Gujarat',           label: 'Ahmedabad, Gujarat',          altitude_m: 53   },
  { id: 'IXC', name: 'Chandigarh', state: 'Chandigarh',        label: 'Chandigarh, Chandigarh',      altitude_m: 321  },
  // Coastal / desert
  { id: 'GOI', name: 'Goa',        state: 'Goa',               label: 'Goa, Goa',                   altitude_m: 7    },
  { id: 'COK', name: 'Kochi',      state: 'Kerala',            label: 'Kochi, Kerala',               altitude_m: 3    },
  { id: 'JAI', name: 'Jaipur',     state: 'Rajasthan',         label: 'Jaipur, Rajasthan',           altitude_m: 431  },
  { id: 'JDH', name: 'Jodhpur',    state: 'Rajasthan',         label: 'Jodhpur, Rajasthan',          altitude_m: 231  },
  // South Indian hill stations
  { id: 'OOT', name: 'Ooty',       state: 'Tamil Nadu',        label: 'Ooty, Tamil Nadu',            altitude_m: 2240 },
  { id: 'MNR', name: 'Munnar',     state: 'Kerala',            label: 'Munnar, Kerala',              altitude_m: 1600 },
  { id: 'CRG', name: 'Coorg',      state: 'Karnataka',         label: 'Coorg, Karnataka',            altitude_m: 1100 },
  { id: 'KDK', name: 'Kodaikanal', state: 'Tamil Nadu',        label: 'Kodaikanal, Tamil Nadu',      altitude_m: 2133 },
  // Northeast + misc
  { id: 'GAU', name: 'Guwahati',   state: 'Assam',             label: 'Guwahati, Assam',             altitude_m: 55   },
  { id: 'SHL', name: 'Shillong',   state: 'Meghalaya',         label: 'Shillong, Meghalaya',         altitude_m: 1496 },
  { id: 'GTK', name: 'Gangtok',    state: 'Sikkim',            label: 'Gangtok, Sikkim',             altitude_m: 1650 },
  { id: 'UDR', name: 'Udaipur',    state: 'Rajasthan',         label: 'Udaipur, Rajasthan',          altitude_m: 598  },
  { id: 'VNS', name: 'Varanasi',   state: 'Uttar Pradesh',     label: 'Varanasi, Uttar Pradesh',     altitude_m: 80   },
];

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

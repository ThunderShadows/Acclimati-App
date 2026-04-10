/** Ordered list of all 30 seed cities for the city picker. */
export interface CityOption {
  id: string;
  name: string;
  state: string;
  label: string; // "Leh, Ladakh"
}

export const CITIES: CityOption[] = [
  // Himalayan corridor
  { id: 'IXL', name: 'Leh',        state: 'Ladakh',            label: 'Leh, Ladakh' },
  { id: 'KUU', name: 'Manali',     state: 'Himachal Pradesh',  label: 'Manali, Himachal Pradesh' },
  { id: 'SLV', name: 'Shimla',     state: 'Himachal Pradesh',  label: 'Shimla, Himachal Pradesh' },
  { id: 'DED', name: 'Dehradun',   state: 'Uttarakhand',       label: 'Dehradun, Uttarakhand' },
  { id: 'RSH', name: 'Rishikesh',  state: 'Uttarakhand',       label: 'Rishikesh, Uttarakhand' },
  { id: 'SXR', name: 'Srinagar',   state: 'J&K',               label: 'Srinagar, J&K' },
  { id: 'DAR', name: 'Darjeeling', state: 'West Bengal',       label: 'Darjeeling, West Bengal' },
  { id: 'MSR', name: 'Mussoorie',  state: 'Uttarakhand',       label: 'Mussoorie, Uttarakhand' },
  // Metros
  { id: 'DEL', name: 'Delhi',      state: 'Delhi',             label: 'Delhi, Delhi' },
  { id: 'BOM', name: 'Mumbai',     state: 'Maharashtra',       label: 'Mumbai, Maharashtra' },
  { id: 'BLR', name: 'Bengaluru',  state: 'Karnataka',         label: 'Bengaluru, Karnataka' },
  { id: 'CCU', name: 'Kolkata',    state: 'West Bengal',       label: 'Kolkata, West Bengal' },
  { id: 'MAA', name: 'Chennai',    state: 'Tamil Nadu',        label: 'Chennai, Tamil Nadu' },
  { id: 'HYD', name: 'Hyderabad',  state: 'Telangana',         label: 'Hyderabad, Telangana' },
  { id: 'PNQ', name: 'Pune',       state: 'Maharashtra',       label: 'Pune, Maharashtra' },
  { id: 'AMD', name: 'Ahmedabad',  state: 'Gujarat',           label: 'Ahmedabad, Gujarat' },
  { id: 'IXC', name: 'Chandigarh', state: 'Chandigarh',       label: 'Chandigarh, Chandigarh' },
  // Coastal / desert
  { id: 'GOI', name: 'Goa',        state: 'Goa',               label: 'Goa, Goa' },
  { id: 'COK', name: 'Kochi',      state: 'Kerala',            label: 'Kochi, Kerala' },
  { id: 'JAI', name: 'Jaipur',     state: 'Rajasthan',         label: 'Jaipur, Rajasthan' },
  { id: 'JDH', name: 'Jodhpur',    state: 'Rajasthan',         label: 'Jodhpur, Rajasthan' },
  // South Indian hill stations
  { id: 'OOT', name: 'Ooty',       state: 'Tamil Nadu',        label: 'Ooty, Tamil Nadu' },
  { id: 'MNR', name: 'Munnar',     state: 'Kerala',            label: 'Munnar, Kerala' },
  { id: 'CRG', name: 'Coorg',      state: 'Karnataka',         label: 'Coorg, Karnataka' },
  { id: 'KDK', name: 'Kodaikanal', state: 'Tamil Nadu',        label: 'Kodaikanal, Tamil Nadu' },
  // Northeast + misc
  { id: 'GAU', name: 'Guwahati',   state: 'Assam',             label: 'Guwahati, Assam' },
  { id: 'SHL', name: 'Shillong',   state: 'Meghalaya',         label: 'Shillong, Meghalaya' },
  { id: 'GTK', name: 'Gangtok',    state: 'Sikkim',            label: 'Gangtok, Sikkim' },
  { id: 'UDR', name: 'Udaipur',    state: 'Rajasthan',         label: 'Udaipur, Rajasthan' },
  { id: 'VNS', name: 'Varanasi',   state: 'Uttar Pradesh',     label: 'Varanasi, Uttar Pradesh' },
];

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

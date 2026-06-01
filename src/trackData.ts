export type TrackRow = {
  id: string;
  type: string;
  geometry: 'line' | 'point' | 'polygon';
  unitprice: number | null;
};

export const TRACK_DATA: TrackRow[] = [
  { id: '#0-14', type: 'Excavation in Hard Rock', geometry: 'line', unitprice: 33.00 },
  { id: '#0-21', type: "F&I, Pavement Marking and Striping", geometry: 'line', unitprice: 168750.00 },
  { id: '#0-22', type: "F&I, Type 'F' Curb and Gutter", geometry: 'line', unitprice: 49.00 },
  { id: '#0-23', type: "F&I, Type 'E' Curb and Gutter", geometry: 'line', unitprice: 56.00 },
  { id: '#0-24', type: "F&I, Type 'D' Curb", geometry: 'line', unitprice: 47.00 },
  { id: '#0-32', type: 'Remove and Replace Existing Chain Link Fence', geometry: 'line', unitprice: 48.00 },
  { id: '#0-33', type: 'Remove and Replace Existing Aluminum Fence', geometry: 'line', unitprice: 41.00 },
  { id: '#0-34', type: 'Remove and Replace Existing Guard Rail', geometry: 'line', unitprice: 81.00 },
  { id: '#0-45', type: 'F&I, 24 inch Ductile Iron Pipe, Class 250 (Bid Alternate to Base Bid 0-4)', geometry: 'line', unitprice: 437.00 },
  { id: '#0-46', type: 'F&I, 30 inch Ductile Iron Pipe, Class 250 (Bid Alternate to Base Bid 0-5)', geometry: 'line', unitprice: 658.00 },
  { id: '#0-1', type: 'Bonds and Insurance', geometry: 'point', unitprice: 718250.00 },
  { id: '#0-10', type: 'F&I, Aerial Flanged Piping connection at NRWWTP', geometry: 'point', unitprice: 229369.00 },
  { id: '#0-11', type: 'F&I, 30 inch Line Stop', geometry: 'point', unitprice: 106061.00 },
  { id: '#0-12', type: 'Connect to Existing EWTM', geometry: 'point', unitprice: 16250.00 },
  { id: '#0-13', type: 'Removal and Replacement of Unsuitable Material', geometry: 'point', unitprice: 36.00 },
  { id: '#0-15', type: 'Existing Minor Utility Adjustment', geometry: 'point', unitprice: 2708.00 },
  { id: '#0-16', type: 'Existing Major Utility Adjustment', geometry: 'point', unitprice: 5417.00 },
  { id: '#0-2', type: 'Mobilization', geometry: 'point', unitprice: 478667.00 },
  { id: '#0-3', type: 'Maintenance of Traffic', geometry: 'point', unitprice: 118125.00 },
  { id: '#0-35', type: 'Remove and Replace Existing Road Sign & Post Assembly', geometry: 'point', unitprice: 2188.00 },
  { id: '#0-36', type: 'Remove and Replace Existing Mailbox', geometry: 'point', unitprice: 369.00 },
  { id: '#0-42', type: 'Restoration of Golf Course', geometry: 'point', unitprice: 66838.00 },
  { id: '#0-43', type: "R&D, Existing Trees", geometry: 'point', unitprice: 9375.00 },
  { id: '#0-44', type: 'F&I, Florida Number 2 Trees', geometry: 'point', unitprice: 5000.00 },
  { id: '#0-6', type: 'F&I, DIP Compact Fittings', geometry: 'point', unitprice: 31762.00 },
  { id: '#0-17', type: 'F&I, Stabilized Subgrade', geometry: 'polygon', unitprice: 15.00 },
  { id: '#0-18', type: 'F&I, Limerock Base', geometry: 'polygon', unitprice: 48.75 },
  { id: '#0-19', type: 'F&I, Asphalt Pavement Restoration', geometry: 'polygon', unitprice: 31.00 },
  { id: '#0-20', type: 'Mill and Resurface Asphalt Pavement', geometry: 'polygon', unitprice: 19.00 },
  { id: '#0-25', type: 'F&I, Concrete Median', geometry: 'polygon', unitprice: 107.00 },
  { id: '#0-26', type: 'F&I, 6 inch Concrete Sidewalk', geometry: 'polygon', unitprice: 107.00 },
  { id: '#0-27', type: 'Remove and Replace Asphalt Driveway', geometry: 'polygon', unitprice: 124.00 },
  { id: '#0-28', type: 'Remove and Replace Concrete Driveway', geometry: 'polygon', unitprice: 191.00 },
  { id: '#0-29', type: 'Remove and Replace Paver Driveway', geometry: 'polygon', unitprice: 127.00 },
  { id: '#0-37', type: 'F&I, Asphalt Walkway', geometry: 'polygon', unitprice: 81.00 },
  { id: '#0-38', type: 'F&I, Paver Walkway', geometry: 'polygon', unitprice: 156.00 },
  { id: '#0-39', type: 'F&I, Concrete Golf Cart Path', geometry: 'polygon', unitprice: 112.00 },
  { id: '#0-40', type: 'F&I, Concrete Golf Cart Path with Rolled Curb', geometry: 'polygon', unitprice: 131.00 },
  { id: '#0-41', type: 'Restoration of Green Areas', geometry: 'polygon', unitprice: 10.50 },
];

export const TRACK_TYPES = TRACK_DATA.map(r => r.type);

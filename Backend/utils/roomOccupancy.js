const normalizeRoomOccupancy = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'occupied'].includes(trimmed)) return true;
    if (['false', '0', 'no', 'n', 'vacant'].includes(trimmed)) return false;
    return Boolean(trimmed);
  }
  return Boolean(value);
};

const isRoomOccupied = (value) => normalizeRoomOccupancy(value);
const isRoomVacant = (value) => !normalizeRoomOccupancy(value);

module.exports = {
  normalizeRoomOccupancy,
  isRoomOccupied,
  isRoomVacant,
};

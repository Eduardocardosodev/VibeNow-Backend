import { getDiskImageMulterOptions } from 'src/@shared/upload/disk-image-multer.config';

export function getMenuItemMulterOptions() {
  return getDiskImageMulterOptions('menu-items');
}

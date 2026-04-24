export function applySavedTheme(): boolean {
  const savedTheme = localStorage.getItem('theme');
  const isDark = savedTheme === 'dark';

  document.body.classList.toggle('dark-theme', isDark);
  document.body.classList.toggle('light-theme', !isDark);

  return isDark;
}

export function toggleTheme(isDark: boolean): void {
  if (isDark) {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    localStorage.setItem('theme', 'light');
  }
}

export function applySavedDensity(): boolean {
  const savedDensity = localStorage.getItem('density');
  const isCompact = savedDensity === 'compact';

  document.body.classList.toggle('compact-density', isCompact);

  return isCompact;
}

export function toggleDensity(isCompact: boolean): void {
  if (isCompact) {
    document.body.classList.add('compact-density');
    localStorage.setItem('density', 'compact');
  } else {
    document.body.classList.remove('compact-density');
    localStorage.setItem('density', 'normal');
  }
}
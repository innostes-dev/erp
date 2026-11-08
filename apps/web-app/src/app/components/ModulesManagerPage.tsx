import { useModules } from '../context/ModulesContext';
import { paths } from '../navigation/routes';
import { CatalogPage } from './CatalogPage';

export function ModulesManagerPage() {
  const { allModules, isModuleActive, activateModule, deactivateModule, userProfile } = useModules();
  const canManage =
    !userProfile ||
    userProfile.is_super_admin ||
    Boolean(userProfile.accessible_modules?.some((m) => m.role.hierarchy_level >= 50));

  return (
    <CatalogPage
      noun="module"
      title="Business modules"
      description="Activate the applications your organization needs. Deactivating a module keeps its data."
      items={allModules}
      isActive={isModuleActive}
      activate={activateModule}
      deactivate={deactivateModule}
      canManage={canManage}
      hrefFor={(id) => paths.module(id)}
    />
  );
}

import unittest
from unittest.mock import MagicMock
from peopleops.masters.services import service, DepartmentService, DesignationService, LocationService, HolidayCalendarService, HolidayService, PicklistService
from peopleops.masters.router import router

class TestMasters(unittest.IsolatedAsyncioTestCase):
    def test_services_instantiate(self):
        """Verify that BaseService implementations are properly created with models."""
        mock_session = MagicMock()
        dept = DepartmentService(mock_session)
        desig = DesignationService(mock_session)
        loc = LocationService(mock_session)
        cal = HolidayCalendarService(mock_session)
        hol = HolidayService(mock_session)
        pick = PicklistService(mock_session)
        
        self.assertIsNotNone(dept)
        self.assertEqual(dept.model.__name__, 'HRMSDepartment')
        self.assertEqual(desig.model.__name__, 'HRMSDesignation')
        self.assertEqual(loc.model.__name__, 'HRMSLocation')
        self.assertEqual(cal.model.__name__, 'HRMSHolidayCalendar')
        self.assertEqual(hol.model.__name__, 'HRMSHoliday')
        self.assertEqual(pick.model.__name__, 'HRMSPicklist')
        
    async def test_masters_service_overview(self):
        """Verify overview logic."""
        res = await service.get_overview()
        self.assertTrue(res["ready"])
        self.assertEqual(res["submodule"], "masters")
        
    def test_router_endpoints_exist(self):
        """Verify that all required CRUD endpoints are defined."""
        paths = []
        def collect_paths(r_list):
            for r in r_list:
                if hasattr(r, "path"):
                    paths.append((r.methods, r.path))
                elif hasattr(r, "original_router"):
                    collect_paths(r.original_router.routes)

        collect_paths(router.routes)
        
        methods_paths = set((tuple(m)[0], p.replace('/masters', '')) for m, p in paths)
        
        # Verify seeds
        self.assertIn(('POST', '/seed'), methods_paths)
        
        # Verify Departments
        self.assertIn(('POST', '/departments'), methods_paths)
        self.assertIn(('GET', '/departments'), methods_paths)
        self.assertIn(('PATCH', '/departments/{id}'), methods_paths)
        self.assertIn(('DELETE', '/departments/{id}'), methods_paths)
        
        # Verify Picklists
        self.assertIn(('POST', '/picklists'), methods_paths)
        self.assertIn(('GET', '/picklists/{category}'), methods_paths)
        self.assertIn(('PATCH', '/picklists/{id}'), methods_paths)
        self.assertIn(('DELETE', '/picklists/{id}'), methods_paths)
        
        # Verify Calendars and Holidays
        self.assertIn(('PATCH', '/holiday-calendars/{id}'), methods_paths)
        self.assertIn(('DELETE', '/holiday-calendars/{id}'), methods_paths)
        self.assertIn(('PATCH', '/holidays/{id}'), methods_paths)
        self.assertIn(('DELETE', '/holidays/{id}'), methods_paths)

if __name__ == "__main__":
    unittest.main()

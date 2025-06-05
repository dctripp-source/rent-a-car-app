// app/dashboard/calendar/page.tsx - NOVA VERZIJA SA PRETRAGOM I REZERVACIJAMA
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CalendarEvent, Rental, Vehicle } from '@/types';
import RentalModal from '@/components/RentalModal';
import RentalDetailsModal from '@/components/RentalDetailsModal';
import ReservationModal from '@/components/ReservationModal';
import { Plus, Calendar as CalendarIcon, Search, Filter, Clock, X } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

const localizer = momentLocalizer(moment);

// Configure moment for Serbian locale
moment.locale('sr', {
  months: 'Januar_Februar_Mart_April_Maj_Jun_Jul_Avgust_Septembar_Oktobar_Novembar_Decembar'.split('_'),
  monthsShort: 'Jan_Feb_Mar_Apr_Maj_Jun_Jul_Avg_Sep_Okt_Nov_Dec'.split('_'),
  weekdays: 'Nedjelja_Ponedjeljak_Utorak_Srijeda_Četvrtak_Petak_Subota'.split('_'),
  weekdaysShort: 'Ned_Pon_Uto_Sri_Čet_Pet_Sub'.split('_'),
  weekdaysMin: 'Ne_Po_Ut_Sr_Če_Pe_Su'.split('_'),
});

export default function CalendarPage() {
  const { fetchWithAuth } = useApi();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  
  // Modal states
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  
  // Search states
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled' | 'reserved'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [allEvents, vehicleSearch, clientSearch, statusFilter]);

  const fetchData = async () => {
    try {
      setError('');
      
      const [rentalsRes, vehiclesRes] = await Promise.all([
        fetchWithAuth('/api/rentals'),
        fetchWithAuth('/api/vehicles'),
      ]);

      if (!rentalsRes.ok || !vehiclesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const rentalsData = await rentalsRes.json();
      const vehiclesData = await vehiclesRes.json();

      setRentals(rentalsData);
      setVehicles(vehiclesData);

      // Convert rentals to calendar events
      const calendarEvents: CalendarEvent[] = rentalsData.map((rental: Rental) => ({
        id: rental.id.toString(),
        title: `${rental.vehicle?.brand} ${rental.vehicle?.model} - ${rental.client?.name}`,
        start: new Date(rental.start_date),
        end: new Date(rental.end_date),
        resource: { rental },
      }));

      setAllEvents(calendarEvents);
      setEvents(calendarEvents);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Greška pri učitavanju podataka');
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = allEvents;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.resource.rental.status === statusFilter);
    }

    // Filter by vehicle
    if (vehicleSearch.trim()) {
      const vehicleSearchLower = vehicleSearch.toLowerCase();
      filtered = filtered.filter(event => {
        const rental = event.resource.rental;
        const vehicleText = `${rental.vehicle?.brand} ${rental.vehicle?.model} ${rental.vehicle?.registration_number}`.toLowerCase();
        return vehicleText.includes(vehicleSearchLower);
      });
    }

    // Filter by client
    if (clientSearch.trim()) {
      const clientSearchLower = clientSearch.toLowerCase();
      filtered = filtered.filter(event => {
        const rental = event.resource.rental;
        const clientText = `${rental.client?.name}`.toLowerCase();
        return clientText.includes(clientSearchLower);
      });
    }

    setEvents(filtered);
  };

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedRental(event.resource.rental);
    setIsDetailsModalOpen(true);
  }, []);

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    // Check if this is a future date for reservation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (start >= today) {
      setSelectedSlot({ start, end });
      setIsReservationModalOpen(true);
    } else {
      // For past dates, open regular rental modal
      setIsRentalModalOpen(true);
    }
  }, []);

  const eventStyleGetter = (event: CalendarEvent) => {
    const rental = event.resource.rental;
    let backgroundColor = '#3174ad';

    switch (rental.status) {
      case 'completed':
        backgroundColor = '#10b981';
        break;
      case 'cancelled':
        backgroundColor = '#ef4444';
        break;
      case 'reserved':
        backgroundColor = '#f59e0b';
        break;
      case 'active':
        if (new Date(rental.end_date) < new Date()) {
          backgroundColor = '#f59e0b'; // Orange for overdue
        } else {
          backgroundColor = '#3174ad'; // Blue for active
        }
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  const handleModalClose = () => {
    setIsRentalModalOpen(false);
    setIsDetailsModalOpen(false);
    setIsReservationModalOpen(false);
    setSelectedRental(null);
    setSelectedSlot(null);
    fetchData();
  };

  const clearFilters = () => {
    setVehicleSearch('');
    setClientSearch('');
    setStatusFilter('all');
  };

  const hasActiveFilters = vehicleSearch || clientSearch || statusFilter !== 'all';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Pokušaj ponovo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Kalendar iznajmljivanja</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Toggle filters button for mobile */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filteri {hasActiveFilters && <span className="ml-1 w-2 h-2 bg-blue-500 rounded-full"></span>}
          </button>
          
          <button
            onClick={() => setIsReservationModalOpen(true)}
            className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            <Clock className="h-5 w-5 mr-2" />
            Nova rezervacija
          </button>
          <button
            onClick={() => setIsRentalModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={vehicles.filter(v => v.status === 'available').length === 0}
          >
            <Plus className="h-5 w-5 mr-2" />
            Novo iznajmljivanje
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className={`bg-white rounded-lg shadow p-4 mb-6 transition-all duration-200 ${showFilters || !showFilters ? 'block' : 'hidden'} sm:block`}>
        <div className="flex items-center justify-between mb-4 sm:hidden">
          <h3 className="text-lg font-medium text-gray-900">Pretraga i filteri</h3>
          <button
            onClick={() => setShowFilters(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Vehicle Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pretraži vozila..."
              value={vehicleSearch}
              onChange={(e) => setVehicleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Client Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pretraži klijente..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">Svi statusi</option>
              <option value="active">Aktivno</option>
              <option value="reserved">Rezervisano</option>
              <option value="completed">Završeno</option>
              <option value="cancelled">Otkazano</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-center justify-between">
            <button
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Očisti filtere
            </button>
            <div className="text-sm text-gray-500">
              {events.length} od {allEvents.length}
            </div>
          </div>
        </div>

        {/* Active filters indicator */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {vehicleSearch && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Vozilo: {vehicleSearch}
                <button
                  onClick={() => setVehicleSearch('')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {clientSearch && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Klijent: {clientSearch}
                <button
                  onClick={() => setClientSearch('')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Status: {statusFilter === 'active' ? 'Aktivno' : statusFilter === 'reserved' ? 'Rezervisano' : statusFilter === 'completed' ? 'Završeno' : 'Otkazano'}
                <button
                  onClick={() => setStatusFilter('all')}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {rentals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">Nemate aktivnih iznajmljivanja</p>
          {vehicles.filter(v => v.status === 'available').length > 0 ? (
            <div className="space-y-2">
              <button
                onClick={() => setIsRentalModalOpen(true)}
                className="block mx-auto text-blue-600 hover:text-blue-700"
              >
                Kreirajte prvo iznajmljivanje
              </button>
              <button
                onClick={() => setIsReservationModalOpen(true)}
                className="block mx-auto text-yellow-600 hover:text-yellow-700"
              >
                ili napravite rezervaciju
              </button>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Prvo dodajte vozila da biste mogli kreirati iznajmljivanja</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              view={view}
              onView={(newView) => setView(newView)}
              date={date}
              onNavigate={(newDate) => setDate(newDate)}
              eventPropGetter={eventStyleGetter}
              messages={{
                next: 'Sljedeći',
                previous: 'Prethodni',
                today: 'Danas',
                month: 'Mjesec',
                week: 'Sedmica',
                day: 'Dan',
                agenda: 'Agenda',
                date: 'Datum',
                time: 'Vrijeme',
                event: 'Događaj',
                noEventsInRange: 'Nema događaja u ovom periodu.',
                showMore: (total) => `+${total} više`,
              }}
            />
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#3174ad] rounded mr-2"></div>
              <span>Aktivno</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#f59e0b] rounded mr-2"></div>
              <span>Rezervisano / Kašnjenje</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#10b981] rounded mr-2"></div>
              <span>Završeno</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#ef4444] rounded mr-2"></div>
              <span>Otkazano</span>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isRentalModalOpen && (
        <RentalModal
          vehicles={vehicles.filter(v => v.status === 'available')}
          onClose={handleModalClose}
        />
      )}

      {isDetailsModalOpen && selectedRental && (
        <RentalDetailsModal
          rental={selectedRental}
          onClose={handleModalClose}
        />
      )}

      {isReservationModalOpen && (
        <ReservationModal
          vehicles={vehicles.filter(v => v.status === 'available')}
          selectedSlot={selectedSlot}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
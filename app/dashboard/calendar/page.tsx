// app/dashboard/calendar/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CalendarEvent, Rental, Vehicle } from '@/types';
import RentalModal from '@/components/RentalModal';
import RentalDetailsModal from '@/components/RentalDetailsModal';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
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
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

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

      setEvents(calendarEvents);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Greška pri učitavanju podataka');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedRental(event.resource.rental);
    setIsDetailsModalOpen(true);
  }, []);

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    // Optional: Open rental modal with pre-selected dates
    setIsRentalModalOpen(true);
  }, []);

  const eventStyleGetter = (event: CalendarEvent) => {
    const rental = event.resource.rental;
    let backgroundColor = '#3174ad';

    if (rental.status === 'completed') {
      backgroundColor = '#10b981';
    } else if (rental.status === 'cancelled') {
      backgroundColor = '#ef4444';
    } else if (new Date(rental.end_date) < new Date()) {
      backgroundColor = '#f59e0b'; // Orange for overdue
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
    setSelectedRental(null);
    fetchData();
  };

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kalendar iznajmljivanja</h1>
        <button
          onClick={() => setIsRentalModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={vehicles.filter(v => v.status === 'available').length === 0}
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo iznajmljivanje
        </button>
      </div>

      {rentals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">Nemate aktivnih iznajmljivanja</p>
          {vehicles.filter(v => v.status === 'available').length > 0 ? (
            <button
              onClick={() => setIsRentalModalOpen(true)}
              className="text-blue-600 hover:text-blue-700"
            >
              Kreirajte prvo iznajmljivanje
            </button>
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
              <div className="w-4 h-4 bg-[#10b981] rounded mr-2"></div>
              <span>Završeno</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#f59e0b] rounded mr-2"></div>
              <span>Kašnjenje</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#ef4444] rounded mr-2"></div>
              <span>Otkazano</span>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
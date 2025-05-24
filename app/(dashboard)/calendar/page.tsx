// app/(dashboard)/calendar/page.tsx
'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CalendarEvent, Rental, Vehicle } from '@/types';
import RentalModal from '@/components/RentalModal';
import RentalDetailsModal from '@/components/RentalDetailsModal';
import { Plus } from 'lucide-react';

const localizer = momentLocalizer(moment);

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
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
      const [rentalsRes, vehiclesRes] = await Promise.all([
        fetch('/api/rentals'),
        fetch('/api/vehicles'),
      ]);

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
    } catch (error) {
      console.error('Error fetching data:', error);
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kalendar iznajmljivanja</h1>
        <button
          onClick={() => setIsRentalModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo iznajmljivanje
        </button>
      </div>

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
      </div>

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
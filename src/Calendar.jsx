import React, { useState, useEffect } from 'react';
import {format,startOfMonth,endOfWeek,addDays,addMonths,subMonths,endOfMonth,startOfWeek,isSameMonth} from 'date-fns';
const getStoredEvents = () => {
  const data = localStorage.getItem('calendarEvents');
  console.log(data);
  return data ? JSON.parse(data) : [];
};
const saveEvent = (events) => {
  localStorage.setItem('calendarEvents', JSON.stringify(events));
};
const Calendar = () => {
  const [currMonth, setcurrMonth] = useState(new Date());
  const [chooseDate, setchooseDate] = useState('');
  const [allEvents, setAllEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', time: '', desc: '', id: null,
    recurrence: {
      type: 'none',  
      interval: 1,  
      daysOfWeek: [],  
      dayOfMonth: null  
    }
  });
  const [edit, setedit] = useState(false);
  const [showAllevent, setshowAllevent] = useState(false);
  const [dateErr, setdateErr] = useState('');

  useEffect(() => {
    setAllEvents(getStoredEvents());
  }, []);

  useEffect(() => {
    saveEvent(allEvents);
  }, [allEvents]);

  const headRender = () => (
    <div className="Head-section">
      <button onClick={() => setcurrMonth(subMonths(currMonth, 1))}>{'<'}</button>
      <span>{format(currMonth, 'MMMM yyyy')}</span>
      <button onClick={() => setcurrMonth(addMonths(currMonth, 1))}>{'>'}</button>
    </div>
  );

  const weekRender = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="calendarRows">
        {days.map((day, index) => (
          <div className="weeksName" key={index}>
            {day}
          </div>
        ))}
      </div>
    );
  };

  const bodyRender = () => {
    const startMnth = startOfMonth(currMonth);
    const endMnth = endOfMonth(startMnth);
    const dateStart = startOfWeek(startMnth);
    const dateEnd = endOfWeek(endMnth);
    const days = [];
    let day = dateStart;

    while (day <= dateEnd) {
      const formaat = format(day, 'yyyy-MM-dd');
      const todayFormat = format(new Date(), 'yyyy-MM-dd');
      const dayEvents = allEvents.filter((event) => event.date === formaat);
      days.push(
        <div
          className={`calendar-today ${!isSameMonth(day, startMnth) ? 'disabled' : ''} ${formaat === todayFormat ? 'today' : ''}`}
          key={formaat}
          onClick={() => {
            setchooseDate(formaat);
            setShowForm(false);
            setshowAllevent(true);
          }}
        >
          <span className="date-number">{format(day, 'd')}</span>
          {dayEvents.length > 0 && (
            <ul className="event-info">
              {dayEvents.map((event) => (
                <li
                  key={event.id}
                  className="event-items"
                  onClick={e => {
                    e.stopPropagation();
                    setFormData({ ...event });
                    setedit(true);
                    setShowForm(true);
                    setshowAllevent(false);
                  }}
                >
                  {event.title} <span>{event.time}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
      day = addDays(day, 1);
    }
    return <div className="date_print">{days}</div>;
  };

  const handleAddEvent = () => {
    if (chooseDate) {
      const selectedDate = new Date(chooseDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        setdateErr('Cannot add events  before current date');
        return;
      }
      setdateErr('');
      setFormData({ title: '', time: '', desc: '', id: Date.now(),recurrence: {
          type: 'none',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null
        }
      });
      setedit(false);
      setShowForm(true);
      setshowAllevent(false);
    }
  };
  const handleFormSubmit = (e) => {
    e.preventDefault();
    const selectedDate = new Date(chooseDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setdateErr('Cannot add events  before current date');
      return;
    }
    setdateErr('');
    const eventDate = chooseDate;
    const newEvent = {
      ...formData,
      date: eventDate,
      id: edit ? formData.id : Date.now()
    };

    if (edit) {
      setAllEvents(allEvents.map(ev => ev.id === formData.id ? newEvent : ev));
    } else {
      if (formData.recurrence.type !== 'none') {
        const recurringEvents = Recurence(newEvent);
        setAllEvents([...allEvents, ...recurringEvents]);
      } else {
        setAllEvents([...allEvents, newEvent]);
      }
    }
    setShowForm(false);
    setFormData({ title: '', time: '', desc: '', id: Date.now(), recurrence: { 
       type: 'none', 
        interval: 1, 
        daysOfWeek: [], 
        dayOfMonth: null 
      } 
    });
    console.log(formData);
    setedit(false);
  };
  const Recurence = (event) => {
    const events = [event];
    const startDate = new Date(event.date);
    const endDate = addMonths(startDate, 3); 
    let currentDate = startDate;

    while (currentDate < endDate) {
      currentDate = addDays(currentDate, 1);
      switch (event.recurrence.type) {
        case 'daily':
          events.push({
            ...event,
            id: Date.now() + events.length,
            date: format(currentDate, 'yyyy-MM-dd')
          });
          break;
        
        case 'week':
          if (event.recurrence.daysOfWeek.includes(format(currentDate, 'EEEE').toLowerCase())) {
            events.push({
              ...event,
              id: Date.now() + events.length,
              date: format(currentDate, 'yyyy-MM-dd')
            });
          }
          break; 
        case 'month':
          if (event.recurrence.dayOfMonth === currentDate.getDate()) {
            events.push({
              ...event,
              id: Date.now() + events.length,
              date: format(currentDate, 'yyyy-MM-dd')
            });
          }
          break;
        case 'custom':
          if (events.length % event.recurrence.interval === 0) {
            events.push({
              ...event,
              id: Date.now() + events.length,
              date: format(currentDate, 'yyyy-MM-dd')
            });
          }
          break;
      }
    }
    return events;
  };
  const handleDelete = () => {
    setAllEvents(allEvents.filter(ev => ev.id !== formData.id));
    setShowForm(false);
    setshowAllevent(false);
    setedit(false);
    setFormData({ title: '', time: '', desc: '', id: null,recurrence: {
        type: 'none',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null
      }
    });
  };

  const chooseDateEvents = chooseDate
    ? allEvents.filter((event) => event.date === chooseDate)
    : [];

  return (
    <div className="calendar-display">
      {headRender()}
      {weekRender()}
      {bodyRender()}

      {dateErr && (
        <div className="err-msg">
          {dateErr}
        </div>
      )}

      {chooseDate && showAllevent && !showForm && (
        <div>
          <button onClick={handleAddEvent}>Add Event</button>
          <button onClick={() => {
            setshowAllevent(false);
            setdateErr('');
          }}>Close</button>
        </div>
      )}

      {chooseDate && showAllevent && chooseDateEvents.length > 0 && (
        <div className="select_event">
          <h4>Events for {format(new Date(chooseDate + 'T00:00:00'), 'PPP')}:</h4>
          <ul>
            {chooseDateEvents.map(event => (
              <li key={event.id} >
                <strong>{event.title}</strong> at {event.time}<br />
                <span>{event.desc}</span><br />
                <button onClick={() => {
                  setFormData({ ...event });
                  setedit(true);
                  setShowForm(true);
                  setshowAllevent(false);
                  setchooseDate(event.date);
                }}>Edit</button>
                <button onClick={() => {
                  setFormData({ ...event });
                  setedit(false);
                  handleDelete();
                }}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {chooseDate && showAllevent && chooseDateEvents.length === 0 && (
        <div className="select_event">
          <h4>Events for {format(new Date(chooseDate + 'T00:00:00'), 'PPP')}:</h4>
          <p>No events for this date.</p>
        </div>
      )}

      {showForm && (
        <div>
          <form className="form-event" onSubmit={handleFormSubmit}>
            <h3>{edit ? 'Edit Event' : 'Add Event'}</h3>
            <div>
              <label>Title:</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Time:</label>
              <input
                type="time"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Description:</label>
              <textarea
                value={formData.desc}
                onChange={e => setFormData({ ...formData, desc: e.target.value })}
              />
            </div>
            <div>
              <label>Recurrence:</label>
              <select
                value={formData.recurrence.type}
                onChange={e => setFormData({
                  ...formData,
                  recurrence: { ...formData.recurrence, type: e.target.value }
                })}
              >
                <option value="none">No Recurrence</option>
                <option value="daily">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {formData.recurrence.type === 'week' && (
              <div>
                <label>Days of Week:</label>
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <label key={day}>
                    <input
                      type="checkbox"
                      checked={formData.recurrence.daysOfWeek.includes(day)}
                      onChange={e => {
                        const days = e.target.checked
                          ? [...formData.recurrence.daysOfWeek, day]
                          : formData.recurrence.daysOfWeek.filter(d => d !== day);
                        setFormData({
                          ...formData,
                          recurrence: { ...formData.recurrence, daysOfWeek: days }
                        });
                      }}
                    />
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </label>
                ))}
              </div>
            )}

            {formData.recurrence.type === 'month' && (
              <div>
                <label>Day of Month:</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.recurrence.dayOfMonth || ''}
                  onChange={e => setFormData({
                    ...formData,
                    recurrence: { ...formData.recurrence, dayOfMonth: parseInt(e.target.value) }
                  })}
                />
              </div>
            )}

            {formData.recurrence.type === 'custom' && (
              <div>
                <label>Repeat every:</label>
                <input
                  type="number"
                  min="1"
                  value={formData.recurrence.interval}
                  onChange={e => setFormData({
                    ...formData,
                    recurrence: { ...formData.recurrence, interval: parseInt(e.target.value) }
                  })}
                />
                <span>days</span>
              </div>
            )}

            <div className="event-action">
              <button type="submit">{edit ? 'Update' : 'Add'}</button>
              {edit && <button type="button" onClick={handleDelete}>Delete</button>}
              <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Calendar;

// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
 
package com.google.sps;
 
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
 
public final class FindMeetingQuery {
 
  public Collection<TimeRange> query(Collection<Event> events, MeetingRequest request) {
    boolean attendeesExist = false;
    List<TimeRange> meetingTimes = new ArrayList<TimeRange>();
 
    /* GENERAL CASES */
    // If duration is too long, return no slots
    if(request.getDuration() > TimeRange.WHOLE_DAY.duration()) {
      System.out.println("Duration is too long.");
      return meetingTimes;
    }
 
    // If no conflicts (no events), return whole day
    if (events.isEmpty()) {
      System.out.println("No events; all slots work.");
      return allSlots();
    }
 
    // If no meeting attendees, return whole day
    attendeeCheck:
    for (Event event:events) {
      if (!event.getAttendees().isEmpty()) {
        attendeesExist = true;
        break attendeeCheck;
      }
    }
 
    if (!attendeesExist) {
      System.out.println("No attendees; all slots work.");
      return allSlots();
    }
 
    // Now, you know:
    // Attendees exist AND there are events AND the duration is acceptable (less than a day).
    // Determine which events count (i.e. meeting invitees are
    // attending those events).

    // First, determine which events count for all MANDATORY attendees.
    // This will be used in the case that no slots are available for
    // ALL attendees.
    List<Event> relEvents = getRelevantEvents(events, request, request.getAttendees());

    // Determine which events count for ALL attendees, mandatory
    // and optional.
    List<String> allAttendees = new ArrayList<String>(request.getAttendees());
    allAttendees.addAll(request.getOptionalAttendees());
    List<Event> allRelEvents = getRelevantEvents(events, request, allAttendees);
 
    // If no attendees (mandatory or optional)
    // have any event conflicts; all slots work.
    if (allRelEvents.size() < 1) {
      System.out.println("No relevant event conflicts; all slots work.");
      return allSlots();
    }
 
    // Working with ALL attendees:
    /* Address contained events. */
    allRelEvents = removeContainedEvents(allRelEvents);
 
    /* Provide available meeting slots. */
    List<TimeRange> allConsideredSlots = getAvailableSlots(allRelEvents, request);

    // If there are no slots, remove optional attendees, then try again.
    // Else, return slots as is.
    if (!allConsideredSlots.isEmpty()) {
      return allConsideredSlots;
    } else {
      // Working with MANDATORY attendees:
      System.out.println("NONE FOUND: No meetings available for all attendees.");
      System.out.println("Finding events for mandatory attendees...");
      return getAvailableSlots(removeContainedEvents(relEvents), request);
    }
  }


  /* FIND RELEVANT EVENTS */
  // Figure out which events actually matter - i.e.
  // a meeting invitee is attending the event - then sort them
  // by start time as they are added to the relevant events list.
  public List<Event> getRelevantEvents(Collection<Event> events, MeetingRequest request, Collection<String> invitees) {
    List<Event> relevantEvents = new ArrayList<Event>();
    for (Event event:events) {
      relevantAttendee:
      for (String attendee:event.getAttendees()) {
        // Check if a meeting attendee is attending the event.
        if (invitees.contains(attendee)) {
          int idx = 0;
          System.out.println("RELEVANT ATTENDEE FOUND: One of the attendees, " + attendee + " has an event obligation.");
            int relEventsSize = relevantEvents.size();
            // If there exists other relevant events, compare them and sort accordingly.
            if (relEventsSize > 0) {
              System.out.println("COMPARING: Relevant events already contains an event. Comparing...");
              System.out.println("EXISTING REL EVENT START: " + relevantEvents.get(idx).getStart());
              System.out.println("THIS REL EVENT START: " + event.getStart());
              while (idx < relEventsSize && TimeRange.ORDER_BY_START.compare(event.getWhen(), relevantEvents.get(idx).getWhen()) > 0) {
                idx++;
              }
            }
          System.out.println("ADDING RELEVANT EVENT: Event added to relevantEvents at index " + idx + "\n");
          relevantEvents.add(idx, event);
          break relevantAttendee;
        }
      }
    }
    return relevantEvents;
  }
 
  /* CONTAINED EVENTS */
  // Account for contained events -
  // that is, for each event, loop through previous events
  // to see if this event is contained wholly in the previous event.
  // If so, remove it - keep events to remove in a list.
  // Start from the beginning.
  public List<Event> removeContainedEvents(List<Event> relevantEvents) {
    int currEventIdx = 0;
    int eventIdx = 0;
    List<Event> containedEvents = new ArrayList<Event>();
    while (currEventIdx < relevantEvents.size()) {
      System.out.println("Checking for contained events...");
      while (eventIdx > 0) {
        Event currEvent = relevantEvents.get(currEventIdx);
        if (relevantEvents.get(eventIdx - 1).getWhen().contains(currEvent.getWhen())) {
          System.out.println("Contained event found!");
          containedEvents.add(currEvent);
          break;
        }
        eventIdx--;
      }
      currEventIdx++;
      eventIdx = currEventIdx;
    }
 
    // Remove contained events.
    for (Event containedEvent:containedEvents) {
      System.out.println("Removing contained event.");
      relevantEvents.remove(containedEvent);
    }
    return relevantEvents;
  }
 
  /* FINAL STEP: PROVIDE MEETING TIMES */
  public List<TimeRange> getAvailableSlots(List<Event> relevantEvents, MeetingRequest request) {
    List<TimeRange> meetingSlots = new ArrayList<TimeRange>();
    // Add time ranges accordingly
    int eventIdx = 0;
    int lastEventIdx = relevantEvents.size() - 1;
    int start = 0;
    int end = 0;
    // TODO: Figure out why duration is a long in the first place.
    int requestDuration = (int) request.getDuration();
    for (Event relEvent:relevantEvents) {
      System.out.println("TRACKED: Event lasting from " + relEvent.getStart() + " to " + relEvent.getEnd());
      if (eventIdx == 0) {
        start = TimeRange.START_OF_DAY;
        end = relEvent.getStart();
        // Don't allow user to create an event from 0 to 0 - ADD STIPULATION FOR MEETING DURATION > 1.
        if (logicCheck(start, end, requestDuration)) {
          meetingSlots.add(TimeRange.fromStartEnd(start, end, false));
          System.out.println("TIME ADDED (START): From " + start + " to " + end);
        }
      } else {
        int prevEventIdx = eventIdx - 1;
        start = relevantEvents.get(prevEventIdx).getEnd();
        end = relEvent.getStart();
        if (logicCheck(start, end, requestDuration)) {
          meetingSlots.add(TimeRange.fromStartEnd(start, end, false));
          System.out.println("TIME ADDED (BTWN): From " + start + " to " + end);
        }
      }
      if (eventIdx == lastEventIdx) {
        start = relEvent.getEnd();
        end = TimeRange.END_OF_DAY;
        if (logicCheck(start, end, requestDuration)) {
          meetingSlots.add(TimeRange.fromStartEnd(start, end, true));
          System.out.println("TIME ADDED (END): From " + start + " to " + end);
        }
      }
      System.out.println("\n");
      eventIdx++;
    }
    return meetingSlots;
  }
 
  // Returns the entire day
  public Collection<TimeRange> allSlots() {
    List<TimeRange> meetingTimes = new ArrayList<TimeRange>();
    meetingTimes.add(TimeRange.WHOLE_DAY);
    return meetingTimes;
  }
 
  // Ensures that meeting suggestions make
  // logical sense - that is, end > start
  // and the duration is encompassed.
  // In place for edge cases as a result of
  // checks for overlaps.
  public boolean logicCheck(int start, int end, int duration) {
    return (start < end) && (start + duration <= end);
  }
}

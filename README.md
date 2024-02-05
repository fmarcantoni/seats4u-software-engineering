# Seats4u - Software Engineering

## Project Overview
seats4u is a ticketing platform that serves three different user groups: consumers, administrators (admin), and venue managers (VM).

### Consumer Functionality:
* View all shows available on seats4u, with options to filter by venue, date, or time.
* Search for shows by partial name
* Select a show and view all seats available for that show
* Select and purchase any number of seats at a time

### Administrator Functionality:
* View all venues and shows on seats4u
* Generate show reports for all shows on seats4u
  * List all shows and venues
  * List all sold seats for each show
  * List all unsold seats for each show
  * Display the revenue generated by each show
* Delete shows

### Venue Manager Functionality:
* Create venues linked to a VM access key
  * Customize left, right, and center section dimensions
* Delete venues
* Create shows at their venues that do not clash with any existing shows at that venue
  * Set show name, date, and time
  * Determine which pricing structure to use: single price or block structure
    * If using a single price structure, set the ticket price
    * If using a block structure, create and customize block dimensions, locations, and prices, as well as delete blocks
    * Switch pricing structure
* Delete shows
* Activate shows that meet activation criteria (all seats at the venue have a price, show has a name, price, date and time)
  * Once a show is active, show customization functionality is no longer available
* Generate show reports for shows at any venue linked to their access key
* Deactivate shows who's start time has passed

## To see the website in action refer to the following link:

https://filippomarcantoni.wixsite.com/portfolio-fmarcanto/portfolio-collections/my-portfolio/seats4u-software-engineering


## Further Notes

*This code was created for the Final Project Assignment in the WPI course CS3733 Software Engineering as taught by Professor George Heineman in B Term of the 2023 school year. This code was created by Filippo Marcantoni, Shivangi Sirsiwal, Samuel Appiah Kubi, and Ian Grzembski.*

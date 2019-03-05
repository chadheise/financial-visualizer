import sys
import numpy as np
import matplotlib.pyplot as plt
import datetime as dt
import matplotlib.dates as mdates

from csvParsers import read_source_file
from dateManipulation import *
from utils import get_factor_of_ten

def main(source_file, expected_annual_return_rate):
    print("Reading source data...")
    entries = read_source_file(source_file)

    # Ordered lists to use in plot
    rate = float(expected_annual_return_rate)
    seriesNames = ["Principle", "Balance", "Expected @ %.2f%%/yr" % (rate * 100.0)]
    colors = ["red", "blue", "green"] 

    dates = [entry["date"] for entry in entries]

    ySeries = []
    principleSeries = createPrincipleSeries([entry["investment"] for entry in entries])
    balanceSeries = createBalanceSeries(entries)
    expectedSeries = createExpectedSeries(entries, rate)

    ySeries = [principleSeries, balanceSeries, expectedSeries]

    print("Plotting data...")
    createPlot(dates, ySeries, seriesNames, colors)

#------------------- Data manipulation methods -------------------#

def createPrincipleSeries(values):
    series = []
    runningTotal = 0.0
    for value in values:
        runningTotal += value
        series.append(runningTotal)
    return series

def createBalanceSeries(entries):
    series = []
    runningTotal = 0.0
    for entry in entries:
        runningTotal += entry["earnings"]
        runningTotal += entry["investment"]
        series.append(runningTotal)
    return series

def createExpectedSeries(entries, annualReturnRate):
    series = []
    runningTotal = 0.0
    for i in range(0, len(entries)):
        entry = entries[i]

        totalPeriods = days_in_year(string_to_date(entry["date"]).year)
        returnPerPeriod = (1.0 + annualReturnRate) ** (1.0 / totalPeriods) - 1.0
        numPeriods = (string_to_date(entry["date"]) - string_to_date(entries[i-1]["date"])).days

        runningTotal = runningTotal * ((1.0 + returnPerPeriod) ** numPeriods)
        runningTotal += entry["investment"]
        print(runningTotal)
        series.append(runningTotal)
    return series

#------------------- Output methods -------------------#

def createPlot(dates, ySeries, seriesNames, colors):
    x = [dt.datetime.strptime(d,'%m/%d/%Y').date() for d in dates]
    
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%m/%d/%Y'))
    plt.gca().xaxis.set_major_locator(mdates.DayLocator())
    
    plt.plot(x, ySeries[0], label=seriesNames[0], color=colors[0], marker=".")
    plt.plot(x, ySeries[1], label=seriesNames[1], color=colors[1], marker=".")
    plt.plot(x, ySeries[2], label=seriesNames[2], color=colors[2], marker=".")


    daysCovered = (x[-1] - x[0]).days
    numXTicks = 20 if len(x) > 20 else len(x)
    xTickGap = int(len(x) / numXTicks)
    xTicks = x[::xTickGap]
    plt.xticks(xTicks, rotation=45)

    y_max = max([value for series in ySeries for value in series])
    y_min_num_ticks = 10
    y_max_num_ticks = 20
    y_step = get_factor_of_ten(y_max / y_max_num_ticks)
    # Ensure there is a good number of ticks
    while((y_max / y_step) < y_min_num_ticks):
        y_step = int(y_step / 2)
    y_range = np.arange(y_max + y_step, step=y_step)
    plt.yticks(y_range, ['$%d' % (value) for value in y_range])
    plt.ylim(ymin=0)

    plt.title('Financial Returns Over Time')
    plt.legend(loc='upper left')

    plt.show()

#------------------- ------------------- -------------------#

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python returnsPlot.py <source.csv> <expectedAnnualReturnRate>")
        exit()
    file_name = sys.argv[1]
    expected_annual_return_rate = sys.argv[2]
    main(file_name, expected_annual_return_rate)

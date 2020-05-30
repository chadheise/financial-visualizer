# ReadMe

This package provides a python script for generating various plots of financial data over time.

## Stacked Plot
* Useful for creating an aggregate view of a variety of financial accounts.
* When transfering funds between different accounts, it can be difficult to track overall performance and net worth overtime. By combining all financial accounts into a single, stacked plot it is easy to see overall financial performance over time. This package enables this type of visualization.

To execute the script run:
`python stackedPlot.py sampleData/sources.csv`

To see what the generated graph looks like, see sampleData/stackedPlot.png

To only show data after a given start date, run:
`python stackedPlot.py sampleData/sources.csv 03/20/2014`

## Financial Returns
* Useful in comparing the long term gains of an account relative to a benchmark annual return percentage. The annual return percentage as a decimal is passed as the last argument.

To execute the script run:
`python returnsPlot.py sampleData/source1.csv .08`

To see what the generated graph looks like, see sampleData/returnsPlotSource1.png

import React, { Component } from 'react';
import { Table } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import './Graph.css';

interface IProps {
  data: ServerRespond[];
}

// Define the custom interface for PerspectiveViewerElement
interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void;
  setAttribute: (name: string, value: string) => void;
}

class Graph extends Component<IProps, {}> {
  table: Table | undefined;
  uniqueTimestamps: Set<number> = new Set(); // Maintain a set of unique timestamps

  componentDidMount() {
    // Define elem as PerspectiveViewerElement
    const elem = document.getElementsByTagName('perspective-viewer')[0] as PerspectiveViewerElement;

    const schema = {
      stock: 'string',
      top_ask_price: 'float',
      top_bid_price: 'float',
      timestamp: 'datetime',
    };

    try {
      // Ensure window.perspective and window.perspective.worker() are defined
      if (window.perspective && window.perspective.worker) {
        this.table = window.perspective.worker().table(schema);
      } else {
        throw new Error('Perspective or Perspective Worker is not available.');
      }

      if (this.table) {
        elem.load(this.table);

        // Set up the element's attributes as an object
        elem.setAttribute('view', 'y_line');
        elem.setAttribute('column-pivots', '["stock"]');
        elem.setAttribute('row-pivots', '["timestamp"]');
        elem.setAttribute('columns', '["top_ask_price"]');
        elem.setAttribute(
          'aggregates',
          JSON.stringify({
            stock: 'distinct count',
            top_ask_price: 'avg',
            top_bid_price: 'avg',
            timestamp: 'distinct count',
          })
        );
      }
    } catch (error) {
      console.error('Error in componentDidMount:', error);
    }
  }

  componentDidUpdate() {
    if (this.table) {
      const uniqueData = this.props.data.filter((el) => {
        const timestamp = el.timestamp.getTime();
        if (!this.uniqueTimestamps.has(timestamp)) {
          this.uniqueTimestamps.add(timestamp);
          return true;
        }
        return false;
      });

      this.table.update(
        uniqueData.map((el: any) => {
          return {
            stock: el.stock,
            top_ask_price: el.top_ask && el.top_ask.price || 0,
            top_bid_price: el.top_bid && el.top_bid.price || 0,
            timestamp: el.timestamp,
          };
        })
      );
    }
  }

  render() {
    return <div style={{ height: '100%' }} />;
  }
}

export default Graph;

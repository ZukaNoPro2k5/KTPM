import { Request, Response } from 'express';
import connection from '../database/database';
import axios from 'axios';

export class AircraftController {
  private userServiceUrl: string;

  constructor() {
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:5001';
  }

  // GET /api/Aircrafts/GetAll
  getAll = (_req: Request, res: Response): void => {
    const query = 'SELECT * FROM Aircrafts';
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching aircrafts:', err);
        res.status(500).json({ message: 'Failed to fetch aircrafts' });
        return;
      }
      res.status(200).json({
        message: 'Aircraft information retrieved successfully',
        aircrafts: results,
      });
    });
  };

  // POST /api/Aircrafts/Add
  add = async (req: Request, res: Response): Promise<void> => {
    const { Model, Manufacturer, Capacity, RangeKm, Description, userID } = req.body;

    // Buoc 1: Validate input
    if (!Model || !Manufacturer || Capacity == null || RangeKm == null || !userID) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    try {
      // Buoc 2: Kiem tra user co phai Admin khong via User Service
      const userRoleResponse = await axios.get(`${this.userServiceUrl}/api/users/${userID}/role`);
      
      if (userRoleResponse.data.role !== 'Admin') {
        res.status(403).json({ message: 'Permission denied: User is not an admin' });
        return;
      }

      // Buoc 3: Them aircraft moi
      const sql = `INSERT INTO Aircrafts (Model, Manufacturer, Capacity, RangeKm, Description)
                   VALUES (?, ?, ?, ?, ?)`;
      connection.execute(
        sql,
        [Model, Manufacturer, Capacity, RangeKm, Description ?? ''],
        (err, result: any) => {
          if (err) {
            console.error('Error adding aircraft:', err);
            res.status(500).json({ message: 'Failed to add aircraft' });
            return;
          }
          res.status(201).json({
            message: 'Aircraft added successfully',
            aircraftID: result.insertId,
          });
        },
      );
    } catch (error: any) {
      console.error('Error calling User Service:', error.message);
      res.status(500).json({ 
        message: 'Error verifying user permissions',
        error: error.message 
      });
    }
  };

  // POST /api/Aircrafts/Edit
  edit = async (req: Request, res: Response): Promise<void> => {
    const { aircraftID, Model, Manufacturer, Capacity, RangeKm, Description, userID } = req.body;

    // Buoc 1: Validate input
    if (!aircraftID || !userID) {
      res.status(400).json({ message: 'Missing aircraftID or userID' });
      return;
    }

    try {
      // Buoc 2: Kiem tra user co phai Admin khong via User Service
      const userRoleResponse = await axios.get(`${this.userServiceUrl}/api/users/${userID}/role`);
      
      if (userRoleResponse.data.role !== 'Admin') {
        res.status(403).json({ message: 'Permission denied: User is not an admin' });
        return;
      }

      // Buoc 3: Kiem tra aircraft co ton tai khong
      const checkAircraftQuery = 'SELECT AircraftID FROM Aircrafts WHERE AircraftID = ?';
      connection.query(checkAircraftQuery, [aircraftID], (err, aircraftResults: any) => {
        if (err) {
          res.status(500).json({ message: 'Error checking aircraft existence', error: err.message });
          return;
        }

        if (aircraftResults.length === 0) {
          res.status(404).json({ message: 'Aircraft not found' });
          return;
        }

        // Buoc 4: Update aircraft
        const sql = `UPDATE Aircrafts
                     SET Model = ?, Manufacturer = ?, Capacity = ?, RangeKm = ?, Description = ?
                     WHERE AircraftID = ?`;
        connection.execute(
          sql,
          [Model ?? null, Manufacturer ?? null, Capacity ?? null, RangeKm ?? null, Description ?? null, aircraftID],
          (err, result: any) => {
            if (err) {
              console.error('Error updating aircraft:', err);
              res.status(500).json({ message: 'Failed to update aircraft' });
              return;
            }
            res.status(200).json({ message: 'Aircraft information updated successfully' });
          },
        );
      });
    } catch (error: any) {
      console.error('Error calling User Service:', error.message);
      res.status(500).json({ 
        message: 'Error verifying user permissions',
        error: error.message 
      });
    }
  };

  // POST /api/Aircrafts/Delete
  delete = async (req: Request, res: Response): Promise<void> => {
    const { aircraftID, userID } = req.body;

    // Buoc 1: Validate input
    if (!aircraftID || !userID) {
      res.status(400).json({ message: 'Missing aircraftID or userID' });
      return;
    }

    try {
      // Buoc 2: Kiem tra user co phai Admin khong via User Service
      const userRoleResponse = await axios.get(`${this.userServiceUrl}/api/users/${userID}/role`);
      
      if (userRoleResponse.data.role !== 'Admin') {
        res.status(403).json({ message: 'Permission denied: User is not an admin' });
        return;
      }

      // Buoc 3: Kiem tra aircraft co ton tai khong
      const checkAircraftQuery = 'SELECT AircraftID FROM Aircrafts WHERE AircraftID = ?';
      connection.query(checkAircraftQuery, [aircraftID], (err, aircraftResults: any) => {
        if (err) {
          res.status(500).json({ message: 'Error checking aircraft existence', error: err.message });
          return;
        }

        if (aircraftResults.length === 0) {
          res.status(404).json({ message: 'Aircraft not found' });
          return;
        }

        // Buoc 4: Xoa aircraft
        const sql = 'DELETE FROM Aircrafts WHERE AircraftID = ?';
        connection.execute(sql, [aircraftID], (err, result: any) => {
          if (err) {
            console.error('Error deleting aircraft:', err);
            res.status(500).json({ message: 'Failed to delete aircraft' });
            return;
          }
          res.status(200).json({ message: 'Aircraft deleted successfully' });
        });
      });
    } catch (error: any) {
      console.error('Error calling User Service:', error.message);
      res.status(500).json({ 
        message: 'Error verifying user permissions',
        error: error.message 
      });
    }
  };
}
